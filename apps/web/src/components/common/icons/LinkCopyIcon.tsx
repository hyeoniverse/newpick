import { LuLink2 } from "react-icons/lu";
import { IconStyled } from "@/styles/Icon";

interface Props {
  className?: string;
}

function LinkCopyIcon({className}: Props) {
  return (
    <IconStyled onClick={() => {}} className={className}>
      <LuLink2 />
    </IconStyled>
  );
}

export default LinkCopyIcon;