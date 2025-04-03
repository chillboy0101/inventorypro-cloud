/**
 * Utilities for handling theme changes
 */

/**
 * Applies dark mode to the document by adding/removing the 'dark' class to the html element
 * 
 * @param darkMode - Whether dark mode should be enabled
 */
export const applyTheme = (darkMode: boolean): void => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
  }
  
  // Store current theme preference in localStorage directly (as a backup)
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
};

/**
 * Get the current theme from localStorage or system preference
 * 
 * @returns boolean - Whether dark mode is enabled
 */
export const getCurrentTheme = (): boolean => {
  // Check if theme is stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  
  // If no stored preference, check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  return false;
};
