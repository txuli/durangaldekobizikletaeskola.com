
import Image from "next/legacy/image";

const SecondSponsor = (props: { Link: string | undefined; img: string | undefined; style: string | undefined }) => {
  return (
      <div className={`mx-auto flex justify-center items-center bg-custom-dark-blue h-16 w-24 md:h-28 md:w-full rounded-lg shadow-lg hover:shadow-xl ${props.style ?? ''}`}>
          <a href={props.Link} className=" flex items-center justify-center">
              <Image
                  src={props.img ?? ''}
                  alt="Logo patrocinador"
                  className="h-full w-auto rounded-lg transition duration-300 transform hover:scale-102  object-contain"
                  width={300}
                  height={95}
              />
          </a>
      </div>
  );
}


export default SecondSponsor;
