import { LuExternalLink } from "react-icons/lu";
import { IconStyled } from "@/styles/Icons";

interface LikeIconProps {
  width?: string;
  height?: string;
}

function LikeIcon() {

  return (
    <IconStyled>
      <div onClick={() => {}}><LuExternalLink /></div>
    </IconStyled>
  );
}
export default LikeIcon;