import Image from "next/image";

const LOGO_URLS: Record<string, string> = {
  volkswagen: "https://vl.imgix.net/img/volkswagen-logo.png?w=80&h=60&fit=clip",
  audi: "https://vl.imgix.net/img/audi-logo.png?w=80&h=60&fit=clip",
  bmw: "https://vl.imgix.net/img/bmw-logo.png?w=80&h=60&fit=clip",
  "mercedes-benz": "https://vl.imgix.net/img/mercedes-benz-logo.png?w=80&h=60&fit=clip",
  skoda: "https://vl.imgix.net/img/skoda-logo.png?w=80&h=60&fit=clip",
  renault: "https://vl.imgix.net/img/renault-logo.png?w=80&h=60&fit=clip",
  peugeot: "https://vl.imgix.net/img/peugeot-logo.png?w=80&h=60&fit=clip",
  citroen: "https://vl.imgix.net/img/citroen-logo.png?w=80&h=60&fit=clip",
  opel: "https://vl.imgix.net/img/opel-logo.png?w=80&h=60&fit=clip",
  ford: "https://vl.imgix.net/img/ford-logo.png?w=80&h=60&fit=clip",
  toyota: "https://vl.imgix.net/img/toyota-logo.png?w=80&h=60&fit=clip",
  hyundai: "https://vl.imgix.net/img/hyundai-logo.png?w=80&h=60&fit=clip",
  kia: "https://vl.imgix.net/img/kia-logo.png?w=80&h=60&fit=clip",
  fiat: "https://vl.imgix.net/img/fiat-logo.png?w=80&h=60&fit=clip",
  mazda: "https://vl.imgix.net/img/mazda-logo.png?w=80&h=60&fit=clip",
  nissan: "https://vl.imgix.net/img/nissan-logo.png?w=80&h=60&fit=clip",
  volvo: "https://vl.imgix.net/img/volvo-logo.png?w=80&h=60&fit=clip",
  tesla: "https://vl.imgix.net/img/tesla-logo.png?w=80&h=60&fit=clip",
  dacia: "https://vl.imgix.net/img/dacia-logo.png?w=80&h=60&fit=clip",
  porsche: "https://vl.imgix.net/img/porsche-logo.png?w=80&h=60&fit=clip",
};

export function BrandLogo({ slug, className }: { slug: string; className?: string }) {
  const url = LOGO_URLS[slug];
  if (!url) {
    return (
      <div className={className}>
        <span className="text-xs font-bold uppercase">{slug}</span>
      </div>
    );
  }
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={slug}
        className="object-contain w-full h-full"
        loading="lazy"
      />
    </div>
  );
}
