package com.cencorse.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsetsController;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // MODE PLEIN ÉCRAN - Cacher les barres système
        View decorView = getWindow().getDecorView();
        WindowInsetsController insetsController = decorView.getWindowInsetsController();
        
        if (insetsController != null) {
            // Activer le mode immersif (cacher les barres système)
            insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
        
        // Activer les edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Reforcer IMMÉDIATEMENT après super.onCreate()
        getWindow().setStatusBarColor(0xFF1e3a8a);
        getWindow().setNavigationBarColor(0xFF1e3a8a);
        
        // Maintenir le mode plein écran après l'initialisation
        decorView.post(new Runnable() {
            @Override
            public void run() {
                if (insetsController != null) {
                    insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
                }
            }
        });
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Maintenir le mode plein écran
        View decorView = getWindow().getDecorView();
        WindowInsetsController insetsController = decorView.getWindowInsetsController();
        if (insetsController != null) {
            insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
        
        // Gérer les insets pour le contenu
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
            // Mode plein écran - pas de padding, le contenu prend tout l'écran
            v.setPadding(0, 0, 0, 0);
            return insets;
        });
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        // Maintenir le mode plein écran
        View decorView = getWindow().getDecorView();
        WindowInsetsController insetsController = decorView.getWindowInsetsController();
        if (insetsController != null) {
            insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Maintenir le mode plein écran quand la fenêtre reprend le focus
            View decorView = getWindow().getDecorView();
            WindowInsetsController insetsController = decorView.getWindowInsetsController();
            if (insetsController != null) {
                insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
                insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        }
    }
}
