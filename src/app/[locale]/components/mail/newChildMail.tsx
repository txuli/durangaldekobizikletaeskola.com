import { Section, Row, Column, Img, Link, Tailwind, Head , Hr} from "@react-email/components";
interface EmailRequestBody {
    name: string;
    birthDate: string;
    address: string;
    city: string;
    school: string;
    guardianName: string;
    phone: string;
    email: string;
    message: string;
}
export const Email = (data:EmailRequestBody) => {
    
    return (


        <Tailwind>
            <Head className="px-8 py-10">
                <Row className="bg-[#3984c8] h-20">
                    <Column className="w-[80%]">
                        <Img
                            alt="React Email logo"
                            width="50"
                            height="50"
                            src="https://photos.txuli.com/duranguesa/big_logo.png"
                        />
                    </Column>
                    <Column align="right">
                        <Row align="right">
                            <Column>
                                <Link href="https://x.com/scduranguesa">
                                    <Img
                                        alt="X"
                                        className="mx-1 "
                                        height="36"
                                        src="https://react.email/static/x-logo.png"
                                        width="36"
                                        
                                    />
                                </Link>
                            </Column>
                            <Column>
                                <Link href="https://www.instagram.com/durangaldeko_bzkeskola/">
                                    <Img
                                        alt="Instagram"
                                        className="mx-1 "
                                        height="36"
                                        src="https://react.email/static/instagram-logo.png"
                                        width="36"
                                    />
                                </Link>
                            </Column>
                            <Column>
                                <Link href="https://www.facebook.com/profile.php?id=100014739280844">
                                    <Img
                                        alt="Facebook"
                                        className="mx-1 "
                                        height="36"
                                        src="https://react.email/static/facebook-logo.png"
                                        width="36"
                                    />
                                </Link>
                            </Column>
                        </Row>
                    </Column>
                </Row>
            </Head>
            <Section>
                <h1>Nuevo formulario de registro de {data.name}</h1>
                <Hr />
                <Row className="flex">
                    <Column className="font-bold mr-2">nombre:</Column>
                    <Column>{data.name}</Column>
                </Row>
                <Row className="flex">
                    <Column className="font-bold mr-2">fecha de nacimiento:</Column>
                    <Column>{data.birthDate}</Column>
                </Row>
                <Row className="flex">
                    <Column className="font-bold mr-2">nombre:</Column>
                    <Column>{data.address}</Column>
                </Row>
            </Section>
        </Tailwind>
    );
};