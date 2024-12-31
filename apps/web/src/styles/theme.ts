export type ThemeName = "light" | "dark";

export type ColorKey =
  | "primary" // 주요 색상
  | "secondary" // 보조 색상
  | "background" // 배경 색상
  | "surface" // 표면 색상 ex) 카드, 버튼
  | "onPrimary" // 주요 색상 텍스트
  | "onSecondary" // 보조 색상 텍스트
  | "disabled" // 비활성 색상
  | "success" // 성공 색상
  | "error" // 오류 색상
  | "warning" // 경고 색상
  | "text"; // 텍스트 색상

export type HeadingSize = "extraLarge" | "large" | "medium" | "small";
export type FontSize =
  | "extraSmall"
  | "small"
  | "medium"
  | "large"
  | "extraLarge";

export type BorderRadius =
  | "soft"
  | "moderate"
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
        background: string;
      };
      disabled: {
        color: string;
        background: string;
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
    primary: "#FFC107", // 노란색 (주요 색상)
    secondary: "#FFD54F", // 연한 노란색 (보조 색상)
    background: "#FFF8E1", // 연한 크림색 (배경 색상)
    surface: "#FFFFFF", // 흰색 (표면 색상)
    onPrimary: "#212121", // 검은색 (주요 텍스트 색상)
    onSecondary: "#212121", // 검은색 (보조 텍스트 색상)
    disabled: "#BDBDBD", // 회색 (비활성 색상)
    success: "#8BC34A", // 초록색 (성공 색상)
    error: "#E57373", // 빨간색 (오류 색상)
    warning: "#FFB300", // 진한 노란색 (경고 색상)
    text: "#333333", // 검은색 (텍스트 색상)
  },
  heading: {
    extraLarge: {
      fontSize: "2.5rem",
    },
    large: {
      fontSize: "2rem",
    },
    medium: {
      fontSize: "1.5rem",
    },
    small: {
      fontSize: "1rem",
    },
  },
  borderRadius: {
    soft: "4px",
    moderate: "8px",
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
      padding: "0.3rem 0.8rem",
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
      color: "#212121",
      background: "#FFC107",
      border: "none",
      hover: {
        background: "#FFB300",
      },
      disabled: {
        color: "#757575",
        background: "#E0E0E0",
      },
    },
    secondary: {
      color: "#212121",
      background: "#FFD54F",
      border: "none",
      hover: {
        background: "#FFCA28",
      },
      disabled: {
        color: "#757575",
        background: "#E0E0E0",
      },
    },
    outline: {
      color: "#FFC107",
      background: "transparent",
      border: "1px solid #FFC107",
      hover: {
        background: "#FFF8E1",
      },
      disabled: {
        color: "#BDBDBD",
        background: "#E0E0E0",
      },
    },
    danger: {
      color: "#FFFFFF",
      background: "#E57373",
      border: "none",
      hover: {
        background: "#D32F2F",
      },
      disabled: {
        color: "#BDBDBD",
        background: "#E0E0E0",
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
    primary: "#FFB300", // 더 짙은 노란색 (주요 색상)
    secondary: "#424242", // 진한 회색 (보조 색상)
    background: "#212121", // 검은색 (배경 색상)
    surface: "#424242", // 진한 회색 (표면 색상)
    onPrimary: "#FFFFFF", // 흰색 (주요 텍스트 색상)
    onSecondary: "#FFC107", // 노란색 (보조 텍스트 색상)
    disabled: "#757575", // 더 연한 회색 (비활성 색상)
    success: "#388E3C", // 진한 초록색 (성공 색상)
    error: "#D32F2F", // 더 진한 빨간색 (오류 색상)
    warning: "#FFA000", // 중간 노란색 (경고 색상)
    text: "#FFFFFF", // 흰색 (텍스트 색상)
  },
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themeName === "dark" ? darkTheme : lightTheme;
};
