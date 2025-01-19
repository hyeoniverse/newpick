import { LuExternalLink } from "react-icons/lu";
import { IconStyled } from "@/styles/Icon";

interface Props {
  className?: string;
}

function LikeIcon({ className }: Props) {
  return (
    <IconStyled onClick={() => {}} className={className}>
      <LuExternalLink />
    </IconStyled>
  );
}
export default LikeIcon;