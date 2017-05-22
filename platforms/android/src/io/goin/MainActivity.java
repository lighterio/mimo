package io.goin;

import android.graphics.Color;

import mimo.core.MimoApp;
import mimo.plugins.*;

public class MainActivity extends MimoApp {

  public int statusBarColor = Color.parseColor("#5577ee");

  @Override
  public void loadPlugins() {
    new MimoContacts().setApp(this);
    new MimoGeo().setApp(this);
    //new MimoPosition().setApp(this);
  }

  @Override
  public int getLayoutId() {
    return R.layout.main;
  }

  @Override
  public int getWebViewId() {
    return R.id.main;
  }

}
