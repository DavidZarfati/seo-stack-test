import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>404 – Page not found / Pagina non trovata</h1>
      <p>
        <Link href="/en">English</Link> · <Link href="/it">Italiano</Link>
      </p>
    </>
  );
}
