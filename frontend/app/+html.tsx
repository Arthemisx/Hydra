import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Shell HTML usado apenas na renderizacao web (estatica).
 * O widget de acessibilidade VLibras e inserido aqui, no HTML bruto, FORA da
 * arvore do React — assim o plugin monta o avatar sem que um re-render do React
 * apague o iframe do player (o que antes deixava a "caixa cinza" vazia).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}

        {/* VLibras — estrutura oficial, no HTML bruto (fora do React) */}
        <div
          dangerouslySetInnerHTML={{
            __html:
              '<div vw class="enabled">' +
              '<div vw-access-button class="active"></div>' +
              '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>' +
              "</div>",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var s=document.createElement('script');" +
              "s.src='https://vlibras.gov.br/app/vlibras-plugin.js';s.async=true;" +
              "s.onload=function(){if(window.VLibras){new window.VLibras.Widget('https://vlibras.gov.br/app');}};" +
              "document.body.appendChild(s);})();",
          }}
        />
      </body>
    </html>
  );
}
