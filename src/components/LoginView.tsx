import { useState } from 'react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="relative z-1 bg-white dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center lg:flex-row dark:bg-gray-900">
        {/* Form */}
        <div className="flex w-full flex-1 flex-col lg:w-1/2">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 sm:px-0">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 dark:text-white/90 text-3xl sm:text-4xl">
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your username and password to sign in!
                </p>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 sm:gap-5">
                  <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4"></path>
                      <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853"></path>
                      <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05"></path>
                      <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335"></path>
                    </svg>
                    Sign in with Google
                  </button>
                  
                </div>
                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">Or</span>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    {/* Username */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Username<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="superuser"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#6579FF] focus:ring-3 focus:ring-[#6579FF]/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-[#6579FF]"
                        required
                      />
                    </div>
                    {/* Password */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Password<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-11 pl-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#6579FF] focus:ring-3 focus:ring-[#6579FF]/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-[#6579FF]"
                          required
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400"
                        >
                          {!showPassword ? (
                            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" fill="#98A2B3"></path>
                            </svg>
                          ) : (
                            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z" fill="#98A2B3"></path>
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Checkbox */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="checkboxLabelOne" className="flex cursor-pointer items-center text-sm font-normal text-gray-700 select-none dark:text-gray-400">
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="checkboxLabelOne"
                              className="sr-only"
                              checked={keepLoggedIn}
                              onChange={(e) => setKeepLoggedIn(e.target.checked)}
                            />
                            <div
                              className={`mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] ${
                                keepLoggedIn
                                  ? 'border-[#6579FF] bg-[#6579FF]'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <span className={keepLoggedIn ? '' : 'opacity-0'}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="1.94437" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                              </span>
                            </div>
                          </div>
                          Keep me logged in
                        </label>
                      </div>
                      <a href="#" className="text-[#6579FF] hover:text-[#4c5fcc] dark:text-[#B2BCFF] text-sm">
                        Forgot password?
                      </a>
                    </div>
                    {/* Button */}
                    <div>
                      <button
                        type="submit"
                        className="bg-[#6579FF] hover:bg-[#4c5fcc] flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white transition"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-5">

                  

                  <p className="text-center text-sm font-normal text-gray-200 sm:text-start dark:text-gray-400">
                   superuser / super123
                  </p>
                  
                  <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                    Don't have an account?{' '}
                    <a href="#" className="text-[#6579FF] hover:text-[#4c5fcc] dark:text-[#B2BCFF]">
                      Sign Up
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Logo Section */}
        <div className="relative hidden h-full w-full items-center lg:flex lg:w-1/2 bg-[#15063B] dark:bg-white/5">
          <div className="z-1 flex items-center justify-center w-full">
            <div className="flex max-w-xs flex-col items-center">
              <div className="mb-6">
                <svg width="399" height="48" viewBox="0 0 399 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M210.911 47.168C208.053 47.168 205.514 46.592 203.295 45.44C201.119 44.2453 199.413 42.624 198.175 40.576C196.938 38.4853 196.319 36.096 196.319 33.408V15.36H206.111V33.28C206.111 34.3467 206.282 35.264 206.623 36.032C207.007 36.8 207.562 37.3973 208.287 37.824C209.013 38.2507 209.887 38.464 210.911 38.464C212.362 38.464 213.514 38.016 214.367 37.12C215.221 36.1813 215.647 34.9013 215.647 33.28V15.36H225.439V33.344C225.439 36.0747 224.821 38.4853 223.583 40.576C222.346 42.624 220.639 44.2453 218.463 45.44C216.287 46.592 213.77 47.168 210.911 47.168Z" fill="#F1F3FF"/>
                  <path d="M242.915 47.232C241.081 47.232 239.267 46.9973 237.475 46.528C235.726 46.0587 234.083 45.3973 232.547 44.544C231.054 43.648 229.774 42.624 228.707 41.472L234.275 35.84C235.299 36.9493 236.515 37.824 237.923 38.464C239.331 39.0613 240.867 39.36 242.531 39.36C243.683 39.36 244.558 39.1893 245.155 38.848C245.795 38.5067 246.115 38.0373 246.115 37.44C246.115 36.672 245.731 36.096 244.963 35.712C244.238 35.2853 243.299 34.9227 242.147 34.624C240.995 34.2827 239.779 33.92 238.499 33.536C237.219 33.152 236.003 32.6187 234.851 31.936C233.699 31.2533 232.761 30.3147 232.035 29.12C231.31 27.8827 230.947 26.3253 230.947 24.448C230.947 22.4427 231.459 20.7147 232.483 19.264C233.507 17.7707 234.958 16.5973 236.835 15.744C238.713 14.8907 240.91 14.464 243.427 14.464C246.073 14.464 248.505 14.9333 250.723 15.872C252.985 16.768 254.819 18.112 256.227 19.904L250.659 25.536C249.678 24.384 248.569 23.5733 247.331 23.104C246.137 22.6347 244.963 22.4 243.811 22.4C242.702 22.4 241.87 22.5707 241.315 22.912C240.761 23.2107 240.483 23.6587 240.483 24.256C240.483 24.896 240.846 25.408 241.571 25.792C242.297 26.176 243.235 26.5173 244.387 26.816C245.539 27.1147 246.755 27.4773 248.035 27.904C249.315 28.3307 250.531 28.9067 251.683 29.632C252.835 30.3573 253.774 31.3387 254.499 32.576C255.225 33.7707 255.587 35.3493 255.587 37.312C255.587 40.3413 254.435 42.752 252.131 44.544C249.87 46.336 246.798 47.232 242.915 47.232Z" fill="#F1F3FF"/>
                  <path d="M298.65 46.464V0H308.442V46.464H298.65Z" fill="#F1F3FF"/>
                  <path d="M330.313 47.168C327.113 47.168 324.212 46.464 321.609 45.056C319.049 43.6053 317.023 41.6427 315.529 39.168C314.036 36.6933 313.289 33.92 313.289 30.848C313.289 27.776 314.036 25.024 315.529 22.592C317.023 20.16 319.049 18.24 321.609 16.832C324.169 15.3813 327.071 14.656 330.313 14.656C333.556 14.656 336.457 15.36 339.017 16.768C341.577 18.176 343.604 20.1173 345.097 22.592C346.591 25.024 347.337 27.776 347.337 30.848C347.337 33.92 346.591 36.6933 345.097 39.168C343.604 41.6427 341.577 43.6053 339.017 45.056C336.457 46.464 333.556 47.168 330.313 47.168ZM330.313 38.272C331.721 38.272 332.959 37.9733 334.025 37.376C335.092 36.736 335.903 35.8613 336.457 34.752C337.055 33.6 337.353 32.2987 337.353 30.848C337.353 29.3973 337.055 28.1387 336.457 27.072C335.86 25.9627 335.028 25.1093 333.961 24.512C332.937 23.872 331.721 23.552 330.313 23.552C328.948 23.552 327.732 23.872 326.665 24.512C325.599 25.1093 324.767 25.9627 324.169 27.072C323.572 28.1813 323.273 29.4613 323.273 30.912C323.273 32.32 323.572 33.6 324.169 34.752C324.767 35.8613 325.599 36.736 326.665 37.376C327.732 37.9733 328.948 38.272 330.313 38.272Z" fill="#F1F3FF"/>
                  <path d="M110.651 28.75L89.2109 1.28H82.1709V46.464H92.2189V19.404L113.339 46.464H120.699V1.28H110.651V28.75Z" fill="#F1F3FF"/>
                  <path d="M134.861 45.12C137.506 46.4853 140.514 47.168 143.885 47.168C146.488 47.168 148.877 46.72 151.053 45.824C153.229 44.928 155.085 43.584 156.621 41.792L151.245 36.416C150.306 37.4827 149.218 38.2933 147.981 38.848C146.744 39.36 145.357 39.616 143.821 39.616C142.157 39.616 140.706 39.2747 139.469 38.592C138.274 37.8667 137.336 36.864 136.653 35.584C136.438 35.1399 136.259 34.667 136.116 34.1652L158.413 34.112C158.584 33.3013 158.69 32.5973 158.733 32C158.818 31.36 158.861 30.7627 158.861 30.208C158.861 27.1787 158.178 24.4907 156.813 22.144C155.49 19.7973 153.656 17.9627 151.309 16.64C148.962 15.3173 146.253 14.656 143.181 14.656C140.024 14.656 137.186 15.36 134.669 16.768C132.152 18.176 130.146 20.1173 128.653 22.592C127.202 25.024 126.477 27.7973 126.477 30.912C126.477 34.0267 127.224 36.8213 128.717 39.296C130.21 41.7707 132.258 43.712 134.861 45.12ZM149.716 27.4048L136.12 27.4432C136.248 26.9943 136.404 26.5719 136.589 26.176C137.229 24.896 138.104 23.9147 139.213 23.232C140.365 22.5067 141.709 22.144 143.245 22.144C144.696 22.144 145.912 22.464 146.893 23.104C147.917 23.7013 148.685 24.5973 149.197 25.792C149.411 26.2737 149.584 26.8113 149.716 27.4048Z" fill="#F1F3FF"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M171.671 15.36L176.863 23.7913L182.103 15.36H192.727L182.376 30.4213L193.367 46.464H182.039L176.295 37.1856L170.327 46.464H159.639L170.778 30.6235L160.215 15.36H171.671Z" fill="#F1F3FF"/>
                  <path d="M271.844 20.096V9.92H293.092V1.28H271.844H269.476H261.796V46.464H271.844V28.736H292.068V20.096H271.844Z" fill="#F1F3FF"/>
                  <path d="M383.092 33.3786L377.187 15.36H369.251L363.378 33.4398L358.051 15.36H348.451L359.203 46.464H367.139L373.273 28.544L379.299 46.464H387.299L398.051 15.36H388.451L383.092 33.3786Z" fill="#F1F3FF"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M52.0947 12.1154C55.1464 12.1154 57.6377 9.65755 57.6377 6.60364C57.6376 3.54978 55.1464 1.09192 52.0947 1.09192C49.9714 1.09196 48.1242 2.27992 47.1934 4.02942H31.4102C30.4143 4.02957 29.5801 4.83219 29.5801 5.85461V35.6202L7.41309 4.79016L7.30957 4.6593C7.05558 4.36705 6.71958 4.1687 6.35645 4.08118L6.20215 4.05286L6.09375 4.04016L5.92676 4.02942H4.52051C3.52453 4.02948 2.69043 4.83222 2.69043 5.85461V36.5978C1.08244 37.5595 0 39.3123 0 41.3243C6.22449e-05 44.3782 2.49129 46.8361 5.54297 46.8361C8.59462 46.836 11.0859 44.3782 11.0859 41.3243C11.0859 39.2423 9.92724 37.4379 8.22559 36.5001V15.3439L29.9414 46.0636L30.082 46.2384C30.4304 46.6211 30.9244 46.8361 31.4375 46.8361H33.3125C34.3076 46.8356 35.1414 46.0342 35.1416 45.0118V28.2423H47.249C48.1965 29.9358 50.0126 31.0782 52.0947 31.0782C55.1464 31.0782 57.6377 28.6204 57.6377 25.5665C57.6377 22.5126 55.1464 20.0548 52.0947 20.0548C50.0034 20.0549 48.1802 21.2072 47.2363 22.9132H35.1416V9.3595H47.2939C48.2532 11.0089 50.0453 12.1153 52.0947 12.1154Z" fill="#F1F3FF"/>
                </svg>
              </div>
              <p className="text-center text-gray-400 dark:text-white/60">
                Multi-tenant ERP Management Platform with Cosmos DB Integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}