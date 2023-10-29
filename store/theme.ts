import { defineStore } from "pinia";

export const useThemeStore = defineStore(
  "theme",
  () => {
    const isDark = ref(false);

    // const setTheme = (theme: "dark" | "light") => {
    //   appTheme.value = theme;
    // };

    const toggle = () => {
     
      isDark.value = !isDark.value;   
      setTheme()
    };

    const setTheme = ()=>{
      
      const selectorHtml = document.getElementById('dark-mode') as HTMLAnchorElement;    
      if(isDark.value) {       
        // htmlElement.classList.add("dark","vt-dark");      
        selectorHtml.classList.add("dark","vt-dark");

      } else {
        // htmlElement.classList.remove("dark","vt-dark");
       
        selectorHtml.classList.remove("dark","vt-dark");
      }
    }
    
    
    return { isDark, toggle, setTheme };

  },
  {
    persist: true,
  }
);
