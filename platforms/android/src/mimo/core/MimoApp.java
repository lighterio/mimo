package mimo.core;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings.Secure;
import android.view.KeyEvent;
import android.view.View;
import android.net.http.SslError;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashMap;

public abstract class MimoApp extends Activity {

  public int statusBarColor = Color.BLACK;

  public int layoutId;
  public int webViewId;
  public WebView webView;
  public ArrayList<MimoPlugin> plugins = new ArrayList<MimoPlugin>();
  public boolean isLoaded = false;

  @SuppressLint({"SetJavaScriptEnabled", "AddJavaScriptInterface"})
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    //Thread.setDefaultUncaughtExceptionHandler(new MimoCrash(this));

    setContentView(getLayoutId());

    webView = (WebView) findViewById(getWebViewId());
    WebSettings settings = webView.getSettings();

    settings.setJavaScriptEnabled(true);
    settings.setAppCacheEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSupportMultipleWindows(false);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
      settings.setAllowUniversalAccessFromFileURLs(true);
    }

    webView.addJavascriptInterface(this, "MimoApp");
    webView.setVisibility(View.VISIBLE);

    webView.setWebViewClient(new WebViewClient() {

      public String url;

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return false;
      }

      @Override
      public void onPageFinished(WebView view, String location) {
        super.onPageFinished(view, location);
        eval("MimoApp.receive(Mimo.read())");
        if (!isLoaded) {
          isLoaded = true;
          for (MimoPlugin plugin : plugins) {
            plugin.load();
          }
          String id = Secure.getString(getContentResolver(), Secure.ANDROID_ID);
          send("deviceId", "'" + id + "'");
        }
      }

      @Override
      public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.proceed();
      }

    });

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      if (0 != (getApplicationInfo().flags &= ApplicationInfo.FLAG_DEBUGGABLE)) {
        webView.setWebContentsDebuggingEnabled(true);
      }
    }
    webView.loadUrl("file:///android_asset/m.html");

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      getWindow().setStatusBarColor(statusBarColor);
    }

    loadPlugins();

    on("html", new MimoListener() {

      @Override
      public void run(String callbackId) {
        webView.post(new Runnable() {
          public void run() {
            webView.loadUrl("file:///android_asset/x.html");
          }
        });
      }

    });
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      if (webView.canGoBack()) {
        webView.goBack();
        return true;
      }
    }
    return super.onKeyDown(keyCode, event);
  }

  public abstract void loadPlugins();
  public abstract int getLayoutId();
  public abstract int getWebViewId();

  /**
   * Print something to the log, with a searchable Mimo prefix.
   * @param object  Any object to be printed.
   */
  public void log(Object object) {
    System.out.print("Mimo: ");
    System.out.println(object);
  }

  public void eval(final String js) {
    webView.post(new Runnable() {
      public void run() {
        webView.loadUrl("javascript:" + js);
      }
    });
  }

  @JavascriptInterface
  public void receive(String text) {
    int slash = text.lastIndexOf("/");
    if (slash > -1) {
      String event = text.substring(0, slash);
      String callbackId = text.substring(slash + 1, text.length());
      emit(event, callbackId);
    }
  }

  @JavascriptInterface
  public void load(String html) {
    webView.loadData(html, "text/html", "UTF-8");
  }

  public HashMap<String, ArrayList<MimoListener>> events = new HashMap<String, ArrayList<MimoListener>>();

  public void on(String event, MimoListener listener) {
    ArrayList<MimoListener> listeners = events.get(event);
    if (listeners == null) {
      listeners = new ArrayList<MimoListener>();
      events.put(event, listeners);
    }
    listeners.add(listener);
  }

  public void emit(String event, String callbackId) {
    ArrayList<MimoListener> listeners = events.get(event);
    if (listeners != null) {
      for (MimoListener listener: listeners) {
        listener.run(callbackId);
      }
    }
  }

  public void send(String event, String json) {
    eval("if(window.Mimo)Mimo.emit('" + event + "'," + json + ")");
  }

  public void send(String event, String callbackId, JSONArray data) {
    send(event + callbackId, data.toString());
  }

  public void send(String event, String callbackId, JSONObject data) {
    send(event + callbackId, data.toString());
  }

  @Override
  public void onPause() {
    super.onPause();
    for (MimoPlugin plugin: plugins) {
      plugin.pause();
    }
    send("pause", "0");
  }

  @Override
  public void onResume() {
    super.onResume();
    for (MimoPlugin plugin: plugins) {
      plugin.resume();
    }
    send("resume", "0");
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    for (MimoPlugin plugin: plugins) {
      plugin.unload();
    }
    send("destroy", "0");
  }
}
