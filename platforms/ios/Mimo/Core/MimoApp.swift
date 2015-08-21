import Foundation
import UIKit

class MimoApp: UIResponder, UIApplicationDelegate {

  var window: UIWindow?
  var view: MimoView?
  var listeners = [String: [Any]]()
  var plugins = [MimoPlugin]()
  var coreLocationController:MimoGeo?

  /**
   * When a Mimo application launches, load its view and plugins.
   */
  func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {

    // Save a reference to the ViewController.
    view = window!.rootViewController as? MimoView

    // Load the application's plugins.
    loadPlugins()

    return true
  }

  /**
   * Override to load plugins.
   */
  func loadPlugins() {
  }

  /**
   *
   */
  func applicationDidBecomeActive(application: UIApplication) {
    view!.eval("Mimo.emit('focus')")
  }

  func applicationWillResignActive(application: UIApplication) {
    view!.eval("Mimo.emit('blur')")
  }

  func on (event: String, _ listener: (String) -> Void) {
    var listeners = self.listeners[event]
    if (listeners == nil) {
      self.listeners[event] = [listener]
    }
    else {
      listeners?.append(listener)
    }
  }

  func emit (event: String, _ callbackId: String) {
    if let listeners = self.listeners[event] {
      for listener in listeners {
        let handler = listener as! (String) -> Void
        handler(callbackId)
      }
    }
  }

  func send (event: String, callbackId: String, data: AnyObject) {
    let key = event + callbackId
    let js = "Mimo.emit('" + key + "'," + stringify(data) + ")"
    view!.eval(js)
  }

  func stringify (value: AnyObject, prettyPrinted: Bool = false) -> String {
    var options = prettyPrinted ? NSJSONWritingOptions.PrettyPrinted : nil
    if NSJSONSerialization.isValidJSONObject(value) {
      if let data = NSJSONSerialization.dataWithJSONObject(value, options: options, error: nil) {
        if let string = NSString(data: data, encoding: NSUTF8StringEncoding) {
          return string as String
        }
      }
    }
    return ""
  }

}

