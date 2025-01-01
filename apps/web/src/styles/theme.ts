export type ThemeName = "light" | "dark";

export type ColorKey =
  | "primary" // 주요 색상
  | "secondary" // 보조 색상
  | "background" // 배경 색상
  | "surface" // 표면 색상 ex) 카드, 버튼
  | "disabled" // 비활성 색상
  | "success" // 성공 색상
  | "error" // 오류 색상
  | "warning" // 경고 색상
  | "text" // 텍스트 색상
  | "border"; // 테두리 색상

export type HeadingSize = "extraLarge" | "large" | "medium" | "small";
export type FontSize =
  | "extraSmall"
  | "small"
  | "medium"
  | "large"
  | "extraLarge";
export type FontWeight =
  | "light"
  | "regular"
  | "medium"
  | "semiBold"
  | "bold"
  | "extraBold";

export type BorderRadius =
  | "flat"
  | "soft"
  | "medium"
  | "rounded"
  | "capsule"
  | "circle";
export type Shadow = "light" | "medium" | "heavy";

export type ButtonSize =
  | "extraSmall"
  | "small"
  | "medium"
  | "large"
  | "extraLarge";
export type ButtonScheme = "primary" | "secondary" | "outline" | "danger";
export type LayoutWidth = "small" | "medium" | "large";
export type MediaQuery = "mobile" | "tablet" | "desktop";

interface Theme {
  name: ThemeName;
  color: Record<ColorKey, string>;

  fontSize: Record<FontSize, string>;
  fontWeight: Record<FontWeight, string>;
  heading: {
    [key in HeadingSize]: {
      fontSize: string;
    };
  };

  borderRadius: Record<BorderRadius, string>;
  shadow: Record<Shadow, string>;

  button: {
    [key in ButtonSize]: {
      fontSize: string;
      padding: string;
      gap?: string;
    };
  };
  buttonScheme: {
    [key in ButtonScheme]: {
      color: string;
      background: string;
      border: string;
      hover: {
        color: string;
        background?: string;
      };
    };
  };

  layout: {
    width: {
      [key in LayoutWidth]: string;
    };
  };
  mediaQuery: {
    [key in MediaQuery]: string;
  };
}

export const lightTheme: Theme = {
  name: "light",
  color: {
    primary: "#2F00FF",
    secondary: "#2705C0",
    background: "#FFFFFF",
    surface: "#F9F9F9",
    disabled: "#BDBDBD",
    success: "#8BC34A",
    error: "#E57373",
    warning: "#FFB300",
    text: "#333333",
    border: "#E0E0E0",
  },
  fontSize: {
    extraSmall: "0.8rem",
    small: "1rem",
    medium: "1.2rem",
    large: "1.5rem",
    extraLarge: "2rem",
  },
  fontWeight: {
    light: "400",
    regular: "500",
    medium: "600",
    semiBold: "700",
    bold: "800",
    extraBold: "900",
  },
  heading: {
    extraLarge: {
      fontSize: "2rem",
    },
    large: {
      fontSize: "1.5rem",
    },
    medium: {
      fontSize: "1.2rem",
    },
    small: {
      fontSize: "1rem",
    },
  },
  borderRadius: {
    flat: "0",
    soft: "4px",
    medium: "8px",
    rounded: "16px",
    capsule: "9999px",
    circle: "50%",
  },
  button: {
    extraLarge: {
      fontSize: "1.5rem",
      padding: "1rem 2rem",
      gap: "1.5rem",
    },
    large: {
      fontSize: "1.3rem",
      padding: "1rem 1.5rem",
      gap: "1rem",
    },
    medium: {
      fontSize: "1.2rem",
      padding: "0.8rem 1.2rem",
      gap: "0.5rem",
    },
    small: {
      fontSize: "1rem",
      padding: "0.5rem 0.8rem",
      gap: "0.3rem",
    },
    extraSmall: {
      fontSize: "0.8rem",
      padding: "0 0.5rem",
      gap: "0.2rem",
    },
  },
  buttonScheme: {
    primary: {
      color: "#FFFFFF",
      background: "#2F00FF",
      border: "none",
      hover: {
        color: "#FFFFFF",
        background: "#2705C0",
      },
    },
    secondary: {
      color: "#212121",
      background: "transparent",
      border: "none",
      hover: {
        color: "#2F00FF",
        background: "transparent",
      },
    },
    outline: {
      color: "#212121",
      background: "transparent",
      border: "1px solid #212121",
      hover: {
        color: "#2F00FF",
      },
    },
    danger: {
      color: "#FFFFFF",
      background: "#E57373",
      border: "none",
      hover: {
        color: "#FFFFFF",
        background: "#D32F2F",
      },
    },
  },
  shadow: {
    light: "0px 1px 3px rgba(0, 0, 0, 0.1)",
    medium: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    heavy: "0px 10px 15px rgba(0, 0, 0, 0.1)",
  },
  layout: {
    width: {
      large: "1020px",
      medium: "760px",
      small: "320px",
    },
  },
  mediaQuery: {
    mobile: "(max-width: 768px)",
    tablet: "(max-width: 1024px)",
    desktop: "(min-width: 1025px)",
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  name: "dark",
  color: {
    primary: "#2705C0", // 더 짙은 노란색 (주요 색상)
    secondary: "#2F00FF", // 진한 회색 (보조 색상)
    background: "#222222", // 검은색 (배경 색상)
    surface: "#424242", // 진한 회색 (표면 색상)
    disabled: "#757575", // 더 연한 회색 (비활성 색상)
    success: "#388E3C", // 진한 초록색 (성공 색상)
    error: "#D32F2F", // 더 진한 빨간색 (오류 색상)
    warning: "#FFA000", // 중간 노란색 (경고 색상)
    text: "#FFFFFF", // 흰색 (텍스트 색상)
    border: "#424242", // 진한 회색 (테두리 색상)
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themeName === "dark" ? darkTheme : lightTheme;
};
