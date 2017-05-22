@UIApplicationMain
class AppDelegate: MimoApp {

  override func loadPlugins() {
    MimoContacts()
    MimoGeo()
  }

}
