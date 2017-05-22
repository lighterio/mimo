package mimo.core;

public abstract class MimoPlugin {

  public MimoApp app;

  public void setApp(MimoApp app) {
    this.app = app;
    app.plugins.add(this);
    this.init();
  }

  public void init() {}

  public void load() {}

  public void pause() {}

  public void resume() {}

  public void unload() {}

}
