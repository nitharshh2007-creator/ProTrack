import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsService } from "@/services";
import type { SettingsData } from "@/services";
import { useAuth } from "./auth.store";

type ThemeContextType = {
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable";
  updateTheme: (theme: "light" | "dark" | "system") => void;
  updateDensity: (density: "compact" | "comfortable") => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to document
  const applyTheme = (themeValue: "light" | "dark" | "system") => {
    const root = document.documentElement;
    
    if (themeValue === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", themeValue === "dark");
    }
  };

  // Apply density to document
  const applyDensity = (densityValue: "compact" | "comfortable") => {
    document.documentElement.classList.toggle("compact", densityValue === "compact");
  };

  // Load initial settings when authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated) {
      const loadSettings = async () => {
        try {
          const settings = await settingsService.getSettings();
          setTheme(settings.theme);
          setDensity(settings.density);
          applyTheme(settings.theme);
          applyDensity(settings.density);
        } catch (error) {
          console.error("Failed to load settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSettings();
    } else {
      // Use default theme when not authenticated
      setTheme("light");
      setDensity("comfortable");
      applyTheme("light");
      applyDensity("comfortable");
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const updateTheme = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
    
    if (isAuthenticated) {
      try {
        await settingsService.updateSettings({ theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme:", error);
      }
    }
  };

  const updateDensity = async (newDensity: "compact" | "comfortable") => {
    setDensity(newDensity);
    applyDensity(newDensity);
    
    if (isAuthenticated) {
      try {
        await settingsService.updateSettings({ density: newDensity });
      } catch (error) {
        console.error("Failed to save density:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      density,
      updateTheme,
      updateDensity,
      isLoading: authLoading || isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
