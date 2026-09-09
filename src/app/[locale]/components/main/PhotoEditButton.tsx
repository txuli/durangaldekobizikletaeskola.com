import { useState } from "react"
interface buttonProps {
    children: string ,
    idSection: number,
    idPage:number
}
const [menuOpen, setMenuOpen] = useState(false); 
async function fetch(idSection:number, idPage:number){
setMenuOpen

}
const PhotoEditButton: React.FC<buttonProps> = ( {children, idSection, idPage} ) => {
    
    /* const response = fetch() */
    return (
        <>
        <button /* onClick={} */>
            {children}
        </button>
        </>
    )
}

export default PhotoEditButton