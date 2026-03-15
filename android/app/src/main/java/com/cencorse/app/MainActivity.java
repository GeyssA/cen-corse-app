package com.cencorse.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Afficher les barres système (heure, opérateur, boutons de navigation)
        // et faire en sorte que le contenu ne les recouvre pas
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Couleur fond app (gray-900) pour la barre de statut et la barre de navigation au démarrage
        getWindow().setStatusBarColor(0xFF111827);
        getWindow().setNavigationBarColor(0xFF111827);
    }
}
