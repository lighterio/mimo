package mimo.core;

public class MimoCrash implements Thread.UncaughtExceptionHandler {

  MimoApp app;

  public MimoCrash(MimoApp app) {
    this.app = app;
  }

  @Override
  public void uncaughtException(Thread thread, Throwable exception) {
    // TODO: Send an error report to the server.
  }
}
