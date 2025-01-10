import React from "react";

const useMypage = () => {

  const handleAnchorNavigation = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: "smooth", block: "start"});
    }
  };

  return {
    handleAnchorNavigation,
  }
};

export default useMypage;
