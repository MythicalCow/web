---
title: Building a 2-Way Superscalar Out-of-Order Processor
date: 2026-05-06
description: A deep dive into designing a custom RV32IM out-of-order processor with explicit register renaming, advanced branch prediction, pipelined caches, and 2-way superscalar execution. We implemented aggressive architectural optimizations that yielded significant performance gains across various workloads.
tags: ['processor-design', 'computer-architecture', 'RISC-V', 'superscalar', 'out-of-order-execution', 'hardware-design']
author: Raghav Tirumale, Ishaan Desai, and Tianhao Chen
readTime: 18 min read
featured: true
draft: true
---

## Advanced Features

### Pipelined Cache

Our out-of-order processor can easily issue back-to-back memory operations, but a simple non-pipelined cache can only start an access when the previous access finishes. That caps sustained throughput at about half of what the SRAM could sustain on a long run of hits. Our non-pipelined setup matches that idea: only one access can be in flight at a time, so the next request waits until the previous one has fully completed. That approach is straightforward but wastes throughput.

We implemented pipelined instruction and data caches so we could use more of that throughput. The CPU-side requests are latched into the pipeline, and the SRAM arrays perform the tag and data access for the instruction already in flight; on cycles where the cache is ready, another request can already be accepted. That lets bursts of hits get close to one cache access complete per cycle, where different accesses overlap across consecutive cycles.

![Pipeline Cache Flow](/blog/superscalar-processor/image3.png)
*Figure 3. Flow diagram explaining the functionality of our pipeline cache.*

However, not every case pipelines cleanly. The data cache stalls when stage two of the pipeline sees a miss and when the miss state machine is still servicing a refill or a dirty writeback. Because we track only one outstanding miss, we never overlap multiple unrelated fills. Miss handling follows write-back, write-allocate: a dirty victim is written to lower memory before the new line is brought in, while a clean victim can go straight to refill. If the faulting access is a store miss, when refill data returns we merge the store's bytes into that line before installing it, so we don't lose the pending write. Overall, misses still block the cache until the correct line is present so correctness is preserved.

The pipelined instruction cache follows the same two-stage pattern and stall-on-miss behavior, but the path is read-only, so there are no dirty lines or store merges, only servicing a cache hit versus waiting on a refill.

![Pipelined Cache IPC Effects](/blog/superscalar-processor/image21.png)
*Figure 4. This diagram explains the IPC effects after adding pipelined instruction and data caches.*

By replacing the standard instruction and data cache with pipelined caches, the IPCs of all the benchmarks improve, with an average of about a 4% improvement. Unlike other features that may only improve certain workloads, pipelined cache improves every benchmark, showing that the behavior of waiting until the last access completes in non-pipelined cache starves both fetch and memory traffic when the program is hit-heavy.

The benchmark that improved the most is compression (0.565 to 0.634). Workloads like that tend to spend many cycles interacting with memory with good locality, so overlapping cache accesses raises effective bandwidth more often than benchmarks that are already bound by misses or logic.

![Fetch Demand Grants](/blog/superscalar-processor/image22.png)
*Figure 5. This diagram shows fetch demand grants before and after pipelining the instruction cache.*

As shown in the diagram above the pipelined instruction cache greatly increases the number of cycles in which our processor is able to satisfy a fetch demand request. By pipelining our icache we achieve near 1 instruction per cycle fetch time allowing for higher throughput fetch demand grants improving overall IPC.

Overall, pipelined caches deliver a broad, moderate speedup driven mainly by better sustained hit rate utilization. Compression shows where that effect is strongest when memory streaming aligns with lots of fast hits.

### Victim Buffer

Instruction caches are vulnerable to conflict misses when several frequently used instruction blocks map to the same small set of cache locations. We found that this was especially prominent in the memory bound aes_sha benchmark that we were provided. Our pipelined instruction cache is 2-way set-associative with 32 sets and 32-byte lines so it only stores 2KB worth of instruction data in this main cache. Even with per-way set hashing in the cache a program with several hot code regions could repeatedly evict lines that may be needed again soon. Without any extra structure, every one of those evicted lines has to be fetched again from the main memory causing a lot of stalling and decrease in IPC.

To address this we implemented a victim buffer as a sidecar to the pipeline instruction cache. The victim buffer stores recently evicted instruction cache lines in small arrays consisting of data, addresses, and valid bits. Whenever there is an instruction cache lookup the cache checks the main tag arrays and also compares the requested line address against victim buffer entries. If the line is found in the main cache, the cache responds normally, however if it is in the victim buffer, the line is readded to the main instruction cache and the request is served without the processor having to refetch the instruction line from the DRAM.

On a true miss, the cache enters its allocated state and requests the missing line from main memory. At the same time if the main cache had to evict a valid line that line is captured and placed into the victim buffer with duplication catching in case there is already an entry with the same address.

![Victim Buffer Diagram](/blog/superscalar-processor/image6.png)
*Figure 6. Diagram explaining the functionality of the instruction cache victim buffer.*

In terms of performance the experiment below demonstrates that scaling the victim buffer size has a direct impact on the IPC of AES SHA. We had to select the elbow point at 8 entries as this gains some of the performance curve without aggressively scaling area and power linearly from the flip flops. The reason performance scales with the victim buffer is because IPC on aes_sha is dominated by instruction-cache conflict behavior specifically from eviction of reused lines. In the production size we recover roughly 25% of lines that would have otherwise required pulling data from main memory.

![Victim Buffer Performance Scaling](/blog/superscalar-processor/image10.png)
*Figure 7. This diagram explains how IPC scales up as the size of the instruction cache victim buffer increases.*

Compared to the original IPC on AES SHA at 0.465 this demonstrates a significant improvement that drastically improves PD^4 on this benchmark that previously was dominating our geometric mean on the competition.

### Split Load-Store Queue

Out-of-order processors allow independent instructions to run ahead of slower, dependent work, but memory instructions are tricky. A load instruction has to respect older stores in program order. Until the addresses and data are known, the processor can't be sure a load and store touch the same bytes. Issuing a load instruction too early can thus result in the instruction fetching the wrong data. A unified load/store queue puts both load and store instructions into one ordered list and allows them to execute in order of each other. However, the issue with this is that load instructions may be independent of older store data, yet they often have to wait for older store instructions to complete before they can be issued. Additionally, having one queue for both loads and stores means stores can fill the queue and leave no room for loads to be issued.

To address this, we implemented a split load-store queue, where loads and stores sit in separate queues, but program order is still shared between them. In a split LSQ, when trying to service memory, we take the oldest load instruction that knows its address and needs its data, then scan every older store to check if the load instruction is safe to issue. If any store's address is unknown or the address overlaps with the load's address and the store's data is not valid yet, then the load cannot be issued. Otherwise, the load instruction can be issued out of order of the store instructions. For store instructions, they are inserted into the store queue with an age tag, and later insert their address, byte mask, and data once they are determined. A store instruction isn't removed from the queue until it is drained to the data cache, which is only done when the head of the store queue has all the necessary data to write into the queue, and wins arbitration with load instructions contending on the same cache port, either when there is no load instruction that still needs a cache refill, or when the store queue is almost full.

![Split LSQ Diagram](/blog/superscalar-processor/image4.png)
*Figure 8. This diagram explains the functionality of our split load-store queue.*

#### Uncommitted Store Forwarding

Additionally, we implemented uncommitted store forwarding in our split LSQ. Uncommitted store forwarding allows store instructions to forward data to new load instructions so the load instructions don't need to go into the data cache to fetch the data it needs. More specifically, when a load instruction is ready to be issued, we scan all older stores with a known address and value, where we check if there is any overlap between their addresses. If a store's address overlaps with the load's address, then the data is forwarded to the load instruction. If several stores overlap with the load address, then overlap is performed from oldest to youngest so each byte gets the youngest strictly older writer. If every byte the load needs is covered, it's a full data forwarding operation. Additionally, we support partial forwarding when not every byte the load needs comes from the SQ. More specifically, we still send the load instruction to the data cache, but when the response comes back we replace the bytes that matched an older store with the forwarded store data and keep the other bytes from the cache. That way overlapped bytes are not read from a stale line. This often happens with a small store and a bigger load.

![Split LSQ IPC Effects](/blog/superscalar-processor/image19.png)
*Figure 9. This diagram shows the IPC effects before and after adding our split load-store queue.*

The above graph shows the comparison of the 6 benchmarks before and after implementing our split LSQ. Overall, the geometric-mean IPC improved by 5%. This suggests there was a slight bottleneck in how the memory operations were queued and serviced, but the improvement wasn't very drastic because the core processor is still limited in other areas.

The improvement in implementing split LSQ is very benchmark dependent. The largest jumps are AES_SHA (0.362 to 0.429) and FFT (0.603 to 0.654). Those workloads probably mix compute with a lot of memory traffic or have streaming/array-style accesses where allowing flexibility between loads and stores scheduling can cut additional waiting compared to a stricter unified LSQ.

For other benchmarks, such as compression and image, the split LSQ showed little to no improvement in the IPC. This means that for these benchmarks, there are other things that bottleneck the processor, such as cache misses, branch behavior, or the memory instructions in the program don't often hit the LSQ limitations the split LSQ fixes.

![ROB Head Memory Stalling](/blog/superscalar-processor/image12.png)
*Figure 10. The above diagram shows ROB head memory stalling before and after implementation of our split LSQ.*

As shown in the diagram above the amount of ROB head memory stalls decreases when the split LSQ is implemented, and it decreases the most in the benchmarks that have the largest gain in IPC. This is because out-of-order load issues and store forwarding allow eligible loads to complete earlier instead of waiting for serialized memory operations. As a result, there is more memory level parallelism, and the processor keeps retirement moving more consistently.

Overall, the graphs show our split LSQ implementation helps when memory scheduling is tight and the chained memory instructions are independent of each other or allow for stored data to be forwarded to load instructions to reduce the number of data cache requests. When that isn't the bottleneck, it shows little to no improvement. An overall improvement of 5% among the benchmark is still worth reporting as a real gain in performance.

### GShare Branch Predictor

Out-of-order processors fetch and dispatch instructions before earlier branches actually finish executing, but branch instructions make this more difficult. If the processor predicts the wrong path, every instruction fetched on the wrong path has to be thrown out. This causes a massive penalty where the processor has to undo its register renaming, flush the reorder buffer, and clear the pipeline. Due to this high cost, the front end has to stay ahead of the execution stage. It has to predict which way the branch will go immediately, before it even has the information it needs, just to keep the functional units full and the processor busy.

To address this, we implemented a GShare branch predictor. Most times, whether a branch is taken or not depends on what recent branches just did. A basic branch predictor only looks at the current branch's address and ignores that history, which means it mispredicts correlated branches. We chose GShare because it gives the best accuracy without taking up too much area. In our GShare predictor, when we need to predict a branch, we take a 9-bit history of our most recent branch predictions and XOR it with the hash of the current instruction's address. This gives us a 9-bit GShare index. After getting the 9-bit GShare index, we then fold it to 8 bits to get the index of the 2-bit counter in the 256-entry table. If the counter says the branch is strongly or weakly taken, we guess taken. If it says not-taken, we guess not-taken. Since this is just a quick table lookup, we can get our prediction in the same cycle we fetch the instruction. We sized it to 256 entries and 9 bits of history because it's enough to disambiguate nested loops. We also initialize all counters to weakly not-taken, which perfectly matches how programs usually behave when they first start up.

![GShare Branch Predictor Diagram](/blog/superscalar-processor/image13.png)
*Figure 11. This diagram explains the functionality of our GShare branch predictor.*

Additionally, we have to handle many branches that can be in flight at the same time. When we make a prediction, we immediately shift that prediction into our global history register, so the very next branch can use it to make its own prediction. However, the issue with this is that if it turns out we predicted wrong, we need a way to fix the history. To handle this, we checkpoint the history right before we make a prediction and push it down the pipeline with the branch instruction. If the execute stage finds out the prediction was wrong, we flush the pipeline and restore the history from that checkpoint, then shift in the correct direction so our branch predictor isn't corrupted by the misprediction.

When a branch officially resolves and commits in program order, we use that checkpoint to find the exact table entry we predicted from, and update the counter up or down based on what actually happened. By waiting until a commit, this ensures we only use the predictor on instructions that were actually on the correct architectural path, so the table never learns bad patterns from squashed wrong-path branches.

![GShare IPC Impact](/blog/superscalar-processor/image9.png)
*Figure 12. Before and after comparison of IPC of our GShare Branch Predictor.*

The above graph shows the comparison of the 6 benchmarks before and after implementing our GShare branch predictor. Overall, the geometric-mean IPC improved from 0.503 to 0.607, representing a 1.21x speedup. This suggests that the processor's front end was previously heavily bottlenecked by branch misprediction penalties, and that capturing historical branch patterns reduces the number of costly pipeline flushes on mispredicts.

The improvement from implementing the GShare predictor is very benchmark-dependent. The largest jumps are seen in Coremark (0.425 to 0.633) and Compression (0.634 to 0.874). Those workloads likely feature complex control flow, such as nested loops, data-dependent if/else chains, and highly correlated branches. In these scenarios, GShare's ability to hash the global history with the PC effectively de-aliases these patterns, allowing the front end to maintain speculative momentum where a static branch predictor would fail.

For other benchmarks, such as AES_SHA (0.429 to 0.442), the GShare predictor showed little improvement in IPC. This means that for this benchmark, there are other things that bottleneck the processor. Cryptographic algorithms typically consist of straight-line math and highly predictable, static loop structures that even a static branch predictor can handle well. Therefore, AES_SHA is likely limited by execution unit latency or memory bandwidth rather than front-end branch behavior.

Overall, the graph shows our GShare implementation helps when a program relies on dynamic, history-correlated control flow to keep the issue queues full. When complex branch behavior isn't the primary bottleneck, it shows little improvement. However, an overall performance improvement of 21% across the benchmark suite is a strong result and a significant architectural gain.

![Mispredict Rate Comparison](/blog/superscalar-processor/image17.png)
*Figure 13. Mispredict rate comparison with and without the GShare branch predictor.*

As shown in the diagram above, the branch mispredict rate decreases when the GShare predictor is implemented, and it decreases the most in the benchmarks that had the largest gains in IPC, such as compression (dropping from 54.25% to 0.03%) and CoreMark (dropping from 52.93% to 13.19%). This is because GShare effectively captures historical branch patterns by hashing the global history with the PC, allowing it to correctly de-alias deeply correlated branches. As a result, the front end wastes less time chasing down wrong-path instructions, meaning the pipeline flushes less often and the execution units stay busy more consistently.

Overall, the graph shows that our GShare implementation helps when a program relies heavily on dynamic, history-dependent control flow to keep the pipeline moving. Even in workloads where the misprediction rate remains somewhat high, such as AES_SHA, the relative reduction is still a clear benefit. An overall reduction in the mean mispredict rate from 61.43% down to 24.14%, making it 2.54x lower across the benchmark suite, is a massive benefit for front-end efficiency and explains the significant IPC speedups reported earlier.

### Branch Target Buffer

A correct prediction is only useful if the fetch stage can also resolve the target address in the very same cycle. Since direct branch targets are unresolved until decode, and indirect targets until execute, waiting for them introduces front-end bubbles that starve the out-of-order pipeline. To eliminate these stalls, we implemented a Branch Target Buffer, a PC-indexed cache that supplies target addresses for repetitive loop backedges and function calls in the same cycle. Our BTB is a direct-mapped array of 32 entries. During fetch, the PC's word address is hashed by XORing two adjacent 5-bit slices, which spreads neighboring branches across different sets. This index checks a 30-bit tag. On a hit, the stored 32-bit target is forwarded to redirect fetch in the next cycle. On a miss, fetch falls through to PC+4, with any necessary recovery handled later in the execute stage.

![Branch Target Buffer Block Diagram](/blog/superscalar-processor/image8.png)
*Figure 14. Block diagram explaining functionality of branch target buffer.*

Our workload analysis indicated that the dynamically taken branch mostly came from a small set of loop backedges and call sites, allowing a 32-entry BTB to capture the working set. This compact capacity enables the use of a full 30-bit tag, which eliminates BTB aliasing, while the direct-mapped layout minimizes datapath latency. To preserve this storage, the BTB is updated during the commit stage and only for branches that were actually taken. This update policy prevents never-taken branches from evicting high-value entries. For indirect branches with shifting targets, a new target overwrites the previous one upon commit, reflecting that a stale target address is incorrect every time it is evaluated.

![BTB IPC Comparison](/blog/superscalar-processor/image15.png)
*Figure 15. IPC comparison with and without the branch target buffer.*

The above graph shows the comparison of the 6 benchmarks before and after implementing our Branch Target Buffer. Overall, the geometric-mean IPC improved from 0.607 to 0.623, representing a 1.03x speedup. This suggests that there was a bottleneck in the front end where the processor was stalling while waiting for branch target addresses to be decoded or computed. The improvement is less than the GShare implementation, which makes sense because knowing the target address only saves cycles if the branch predictor is already keeping the pipeline full.

The improvement from implementing the Branch Target Buffer is benchmark-dependent. The largest jumps are seen in AES_SHA (0.442 to 0.465), Image (0.470 to 0.488), and Mergesort (0.599 to 0.619). Those workloads likely feature short, predictable loops or frequent, repetitive function calls. In these scenarios, the BTB's ability to cache and immediately supply the target address upon a predicted-taken branch eliminates front-end bubbles, saving fetch cycles.

For other benchmarks, such as Compression, the BTB showed exactly zero improvement in IPC (flat at 0.874). This means that for this benchmark, there are other things that bottleneck the processor. The workload might be dominated by biased not-taken branches, or it is bottlenecked by other factors like memory latencies and cache misses, rendering front-end fetch optimizations less visible.

The graph shows that our Branch Target Buffer implementation helps when front-end stalls from computing branch target addresses are starving the execution units. When target computation isn't the primary bottleneck, it shows little to no improvement. However, an overall performance improvement of 3% across the benchmark suite is still a solid architectural gain that works well with the GShare predictor to eliminate zero-cycle fetch bubbles.

![Branch Mispredict Rate Before/After BTB](/blog/superscalar-processor/image14.png)
*Figure 16. Branch mispredict rate before and after implementation of the BTB target predictor.*

As shown in the diagram above, the overall branch misprediction rate decreases further when the Branch Target Buffer is implemented alongside the branch predictor. The mean misprediction rate drops from 24.14% to 19.04%, representing a 1.27x reduction. This improvement occurs because even with perfect prediction, failing to supply the target address causes the fetch stage to either stall or incorrectly fall through to PC+4. By caching and supplying the correct target in the same cycle, the Branch Target Buffer prevents these target-related front-end misses and wrong-path issues.

The decrease in misprediction rate is most prominent in benchmarks that feature highly repetitive branch targets. The largest drop is seen in FFT (decreasing from 26.76% to 12.93%), with reductions also visible in AES_SHA, Image, and Mergesort. These workloads likely consist of short computational loops and frequent function calls. The BTB successfully caches these stable target addresses, allowing the front end to instantly redirect fetch rather than wasting cycles decoding the target.

For other benchmarks, such as Compression, the mispredict rate remains completely flat at 0.03%. This indicates that the workload's remaining branches are either heavily biased toward not-taken, or that the branch predictor had already optimized the control flow.

Overall, the graph shows our Branch Target Buffer implementation helps significantly when front-end efficiency is bottlenecked by unknown target addresses on predicted-taken branches. Reducing target-related mispredictions by 1.27x across the suite complements the GShare predictor, verifying that caching targets is a necessary step to eliminate front-end bubbles and achieve the IPC speedups reported earlier.

### Return Address Stack

Function returns are difficult to predict from the PC alone. Since a function can be invoked from multiple sites, a single return PC has a different correct target each time the caller changes. Predictors that cache just one target per PC will inevitably mispredict these returns, resulting in costly flushes of the entire speculative window. To address this, we recognized that returns are perfectly predictable if we mirror the program's call/return discipline. Since calls and returns act similarly to a stack, the correct return target is always the address pushed by the most recent unmatched call.

We implemented a Return Address Stack to complement our branch target buffer and branch predictor. The Return Address Stack is a 4-entry hardware stack of 32-bit return addresses. During fetch, we inspect decoded instructions using standard RISC-V link-register conventions to identify calls and returns. When a call is issued, the address of the next sequential instruction is pushed onto the stack. When a return is fetched, the top entry is popped and immediately used as the predicted target, allowing the front end to redirect in the same cycle. If the stack is empty, the return provides no prediction and resolves later in the execute stage.

### Superscalar

To increase instruction throughput especially on benchmarks with high level of instruction level parallelism (ILP) we implemented a 2-way superscalar advanced feature for our out of order core. The goal of superscalar execution is to exploit the instruction level parallelism inherent in a program where if two nearby instructions are independent the processor should be able to fetch, rename, issue, execute, and retire more than one instruction per cycle allowing for higher IPC. This allows for the functional units in the backend to be busier as more instructions are fed from the frontend. We find that the most common operation that this applies for is arithmetic so we specifically scale up the number of ALUs while leaving the number of other functional units the same. This design choice allows us to scale up ILP while fitting within the 300k cell count engineering design limit that has been imposed for this project.

In more detail, our design widens the core at the points where extra bandwidth is most useful. The fetch unit can produce up to two adjacent RV32 instructions per cycle by requesting both PC and PC+4 instruction addresses, pushing these instructions into the instruction queue. As long as the second instruction is available, the instruction queue has room, and the first instruction doesn't redirect control flow (which would invalidate the second instruction) we are able to push two instructions into the IQ per cycle.

For decode we have two lanes, with rename able to allocate up to two instructions into the Reorder Buffer (ROB) per cycle. In order to maintain the correctness of execution, we treat slot 0 as an older instruction with slot 1 getting renamed after it. If slot 1 reads a register written by slot 0 in the same cycle, then we have a custom rename bypassing slot 0's newly allocated physical destination tag into slot 1 so that the dependencies are properly respected despite the instructions entering the processor together.

![Superscalar Datapath](/blog/superscalar-processor/image7.png)
*Figure 17. Block diagram explaining the superscalar advanced feature.*

After the rename is completed, the two instructions are then dispatched into the reservation stations of our functional unit based on the instruction type. The main execution level expansion compared to the processor without superscalar comes from duplicating the ALU/branch path. The processor has two reservation station banks and two ALU execution lanes allowing two independent integer or branch operations to issue and execute in parallel per cycle. Each ALU has its own writeback path, so both results can wake dependent instructions and write to the PRF in the same cycle. This optimization directly targets benchmarks such as compression where several arithmetic operations are streamed into the processor. It's important to note here that functional units such as the multiplier and divider weren't duplicated as they weren't universally used across benchmarks and therefore weren't worth the extra area for our design. Similarly scaling LSQ further required more complex logic which created larger timing cones and areas that didn't fit within our constraints.

Finally, the retirement portion of our processor is also 2-wide allowing us to make 2 commits per cycle. The ROB exposes two completed head entries and retires both in program order, which lets the machine preserve precise state of commits while still taking advantage of out-of-order execution internally. Slot 1 can only retire when slot 0 is also read and there is no branch recovery that would cause the younger work to get flushed. This keeps the architectural state simple and precise while still allowing the adjacent instructions to commit together. More advanced versions of this could be explored in future designs.

![Superscalar IPC Before/After](/blog/superscalar-processor/image16.png)
*Figure 18. This diagram shows the before and after IPCs for the superscalar advanced feature.*

Overall we see that superscalar significantly improved performance especially on benchmarks like coremark and compression which are able to exploit higher ILP with compression's IPC jumping up to over 1.5 IPC in our final design. One drawback to this design however is that the power consumption from superscalar led to overall subpar performance on PD^4 metrics during the design competition. Although on some benchmarks we had higher IPC compared to competitors, our overall delay improvement wasn't enough to justify the power increase to about 40 mW. This is shown in a below screenshot from the competition.

![Dual Dispatch Diagram](/blog/superscalar-processor/image20.png)
*Figure 18. This diagram shows the uptick in dual dispatch that is enabled by superscalar.*

As shown in the figure above the superscalar based processor allows for much higher issuing throughput across various benchmarks directly increasing the IPC. We see that for benchmarks with high ILP we are able to convert a large amount of the cycles into dual issue cycles greatly increasing the amount of computation we can do per cycle. Dual dispatch cycles as shown above directly corresponded with benchmarks that had larger IPC increases such as compression and mergesort.

![Leaderboard Snapshot](/blog/superscalar-processor/image18.png)
*Figure 19. Leaderboard snapshot demonstrating the importance of minimizing processor power.*

As shown here, our IPC is higher than ranks 7-12, however due to the power used by our processor our overall PD^4 was subpar on this benchmark. Finally we conclude our advanced features by including a block diagram explaining the microarchitectural details of our processor:

## Final Architecture

![Architecture Block Diagram](/blog/superscalar-processor/image11.png)
*Figure 20. Architecture Block Diagram of Final Team MOoOo Processor.*

## Results

![IPC Progression Trend](/blog/superscalar-processor/image2.png)
*Figure 21. IPC progression trend during advanced feature stage of processor development.*

The above diagram shows the progression of the geometric mean on IPCs collected on the six released benchmarks (coremark_im, aes_sha, mergesort, etc). Different features had different effects on different kinds of benchmarks however certain features such as GShare and Superscalar had more overarching performance benefits as they are large structural changes that help across the processor as a whole.

![Benchmark IPC Trends](/blog/superscalar-processor/image23.png)
*Figure 22. Benchmark IPC trends across all the advanced features implemented.*

This behavior is shown in the above figure where depending on the benchmark different features had different impacts on the performance. For example superscalar was a lot more effective on mergesort and compression, whereas split-lsq was most useful on aes_sha and fft. GShare was particularly useful on loopy/branchy behavior like coremark and compression.

## Conclusion

In conclusion, we designed a 2-way superscalar RV32IM out-of-order processor with explicit register renaming, precise commits, and numerous additional advanced features such as a split LSQ, GShare branch predictor with BTB+RAS, and pipelined data/instruction caches. Our main design objectives was to holistically improve performance but shifted towards an ILP based approach in the latter stages of the design process that prompted us to work towards a superscalar based design. The most interesting part of our design was high throughput execution on the compression and mergesort benchmarks via superscalar as we were able to significantly increase IPC on this benchmark particularly. Another interesting feature outside of the advanced features list was the victim buffer which demonstrated scaling benefit on the aes_sha benchmark. The engineering constraint for our design was to meet timing at a competitive frequency of 500MHz as well as meet the 300k cell count area constraint. Overall, our processor demonstrates that intentional performance driven design choices can produce substantial IPC gains across benchmarks, but the punchline is that these changes should be balanced with the area and timing constraints at hand as well as the overall processor power. This was a great learning experience for us as a team and we enjoyed working on the processor and participating in the design competition.
