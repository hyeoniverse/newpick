import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { useState } from "react";
import { IconStyled } from "@/styles/Icons";

interface LikeIconProps {
  width?: string;
  height?: string;
}

function LikeIcon() {
  const [ like, setLike ] = useState(false)

  const handleLike = () => {
    setLike(!like);
  }

  return (
    <IconStyled>
      {like ?
        <div onClick={handleLike}><IoMdHeart /></div>
        :
        <div onClick={handleLike}><IoMdHeartEmpty /></div>
      }
    </IconStyled>
  );
}



export default LikeIcon;