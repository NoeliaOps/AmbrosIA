// El layout de autenticación NO debe envolver ni centrar a sus hijos:
// cada página de auth controla su propio lienzo a pantalla completa.
// (Un wrapper con bg/flex/padding aquí provocaba el efecto "login en un cuadro".)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
