import Image from "next/image";
import { Link } from "@/i18n/routing";
import Section from "@/app/[locale]/components/main/Section";

export interface NewsItem {
  href: string;
  imageSrc: string;
  alt: string;
  date: string;
  title: string;
  category: string;
}

interface NewsProps {
  items: NewsItem[];
}

export default function News({ items }: NewsProps) {
  return (
    <Section className="flex flex-wrap gap-8 justify-center sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3  xl:h-116">
      {items.map((item, index) => (
        <article
          key={index}  
          className="group relative h-96 w-86 hover:w-100 lg:hover:h-100 transition-all duration-300 ease-in-out  mx-auto mb-20 xl:MB-0 "
        >
          <Link href={item.href} className="hover:cursor-pointer">
            <Image
              src={item.imageSrc}
              alt={item.alt}
              width={400}
              height={240}
              className="w-full h-96 object-cover rounded-t-2xl"
            />
            <div className="bg-customDarkBlue text-white text-center rounded-b-2xl pl-1 h-21">
              <main className="ml-1 pb-2 flex flex-col justify-center">
                <h4 className="font-fredoka font-light text-left text-sm px-1 opacity-75 mt-1">
                  {item.category}
                </h4>
                <h3 className="font-fredoka font-normal text-xl text-left px-1">
                  {item.title}
                </h3>
                <div className="flex font-fredoka px-1 opacity-75">
                  {item.date}
                </div>
              </main>
            </div>
          </Link>
        </article>
      ))}
    </Section>
  );
}
