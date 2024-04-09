import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-white">
        <div className="bg-white w-full h-fit">
            {/* horizontal navbar */}
            <nav className="">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-10">
                  <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Image src="/logo.svg" alt="Carbon" width={60} height={60}/>
                      {/* <span className="self-center text-3xl font-semibold whitespace-nowrap dark:text-black">Raghav Tirumale</span> */}
                  </a>
                  <div className="block w-auto pb-5" id="navbar-dropdown">
                    <ul className="flex flex-col font-medium md:p-0 mt-4 borderrounded-lg md:space-x-4 rtl:space-x-reverse md:flex-row">
                      <li>
                        <a href="https://github.com/MythicalCow" className="block py-2 pr-3 text-black hover:text-blue-900 rounded">GitHub ↗</a>
                      </li>
                      <li>
                        <a href="https://www.linkedin.com/in/raghavtirumale/" className="block py-2 pr-3 text-black hover:text-blue-900 rounded">LinkedIn ↗</a>
                      </li>
                      <li>
                        <a href="" className="block py-1 pl-3 pr-3 my-1 text-white bg-black rounded">Contact</a>
                      </li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 pt-10">
                      <div className="  bg-white">
                          <div className="flex items-center justify-left w-full h-full ps-0">
                              <div className="w-full pr-10">
                                  <h1 className="text-6xl font-extrabold text-black w-full pb-5">Hi, I am Raghav</h1>
                                  <p className="text-2xl font-normal text-black w-full pb-5">embedded software | AI/ML/CV | design</p>
                              </div>
                          </div>
                      </div>
                      <div className=" bg-white">
                          <div className="flex w-full h-full pt-5">
                              {/* image 6704 */}
                              <Image src="/raghav.png" alt="6704" width={600} height={600}/>
                          </div>
                      </div>
                  </div>


                </div>
            </nav>
        </div>
    </main>
  );
}
