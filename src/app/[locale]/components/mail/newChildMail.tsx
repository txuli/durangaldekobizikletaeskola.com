import { Section, Row, Column, Img, Link, Tailwind, Head, Hr, Text } from "@react-email/components";

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

export const Email = (data: EmailRequestBody) => {
  return (
    <Tailwind>
      {/* HEADER */}
      <Head />
      <Section className="bg-[#3984c8] py-4 px-6 text-white">
        <Row>
          <Column className="w-[80%] flex items-center">
            <Img
              alt="Durangaldeko Logo"
              width="50"
              height="50"
              src="https://photos.txuli.com/duranguesa/big_logo.png"
            />
            <Text className="ml-4 text-xl font-bold">Durangaldeko Bizikleta Eskola</Text>
          </Column>
          <Column align="right">
            <Row align="right">
              <Column>
                <Link href="https://x.com/scduranguesa">
                  <Img alt="X" height="36" src="https://react.email/static/x-logo.png" width="36" />
                </Link>
              </Column>
              <Column>
                <Link href="https://www.instagram.com/durangaldeko_bzkeskola/">
                  <Img alt="Instagram" height="36" src="https://react.email/static/instagram-logo.png" width="36" />
                </Link>
              </Column>
              <Column>
                <Link href="https://www.facebook.com/profile.php?id=100014739280844">
                  <Img alt="Facebook" height="36" src="https://react.email/static/facebook-logo.png" width="36" />
                </Link>
              </Column>
            </Row>
          </Column>
        </Row>
      </Section>

      {/* BODY */}
      <Section className="p-6 bg-gray-50">
        <Text className="text-xl font-bold mb-4">Nuevo registro de {data.name}</Text>
        <Hr className="my-4 border-gray-300" />

        {/* Información del registro */}
        <Section className="space-y-2">
          <Row>
            <Column className="font-bold w-[150px]">Nombre:</Column>
            <Column>{data.name}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Fecha de nacimiento:</Column>
            <Column>{data.birthDate}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Dirección:</Column>
            <Column>{data.address}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Ciudad:</Column>
            <Column>{data.city}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Escuela:</Column>
            <Column>{data.school}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Nombre del tutor:</Column>
            <Column>{data.guardianName}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Teléfono:</Column>
            <Column>{data.phone}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Email:</Column>
            <Column>{data.email}</Column>
          </Row>
          <Row>
            <Column className="font-bold w-[150px]">Mensaje:</Column>
            <Column>{data.message}</Column>
          </Row>
        </Section>
      </Section>

      {/* FOOTER */}
      <Section className="p-6 text-center text-gray-500 text-sm">
        © 2025 Durangaldeko Bizikleta Eskola. Todos los derechos reservados.
      </Section>
    </Tailwind>
  );
};
