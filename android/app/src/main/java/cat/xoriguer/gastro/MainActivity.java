package cat.xoriguer.gastro;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // El WebView d'Android no té window.print(): la web crida XoriguerImpressio.imprimeix(títol)
        // i s'obre el diàleg d'impressió del sistema (impressora o «Desa com a PDF»).
        WebView web = getBridge().getWebView();
        web.addJavascriptInterface(new Impressio(web), "XoriguerImpressio");
    }

    private class Impressio {
        private final WebView web;

        Impressio(WebView web) { this.web = web; }

        @JavascriptInterface
        public void imprimeix(final String titol) {
            runOnUiThread(() -> {
                String nom = (titol == null || titol.trim().isEmpty()) ? "Xoriguer Gastro" : titol.trim();
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter ad = web.createPrintDocumentAdapter(nom);
                pm.print(nom, ad, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
            });
        }
    }
}
