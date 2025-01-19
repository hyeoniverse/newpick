import { IconStyled } from "@/styles/Icon";

interface Props {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function CustomIcon({ children, onClick, className }: Props) {
  return (
    <IconStyled>
      <div className={className} onClick={onClick}>{children}</div>
    </IconStyled>
  );
}

export default CustomIcon;