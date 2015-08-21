import Foundation
import UIKit

class MimoView: UIViewController, UIWebViewDelegate {

  @IBOutlet var webView: UIWebView!

  var app = UIApplication.sharedApplication().delegate as! MimoApp

  /**
   * When the view loads, load "m.html" into it.
   */
  override func viewDidLoad() {
    super.viewDidLoad()
    let path = NSBundle.mainBundle().pathForResource("m", ofType: "html")
    let url = NSURL(fileURLWithPath: path!)
    let request = NSURLRequest(URL: url!)
    webView.delegate = self
    webView.gestureRecognizers?.removeAll(keepCapacity: false)
    webView.scrollView.bounces = false
    webView.loadRequest(request)
  }

  /**
   * Use a light content status bar with a black background.
   */
  override func preferredStatusBarStyle() -> UIStatusBarStyle {
    view.backgroundColor = UIColor.blackColor()
    return UIStatusBarStyle.LightContent
  }

  /**
   * When the device orientation changes, resize the webview.
   */
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    sizeWebView()
  }

  /**
   * Resize the webview, leaving 18 pixels at the top for the status bar.
   */
  func sizeWebView() {
    let size = view.frame.size
    let width = size.width
    let height = size.height
    webView.frame = CGRectMake(0, 18, width, height - 18)
  }

  /**
   * Evaluate a string of JavaScript.
   */
  func eval(js:String) -> String! {
    return webView.stringByEvaluatingJavaScriptFromString(js)
  }

  /**
   * When the hash in a URL changes, receive some data.
   */
  func webView(webView: UIWebView, shouldStartLoadWithRequest request: NSURLRequest, navigationType: UIWebViewNavigationType) -> Bool {
    readData()
    return true
  }

  /**
   * Read and process data from the Mimo JavaScript object.
   */
  func readData() {
    let data = eval("Mimo.read()")!
    let length = count(data)
    if length > 0 {

      let event = data.stringByDeletingLastPathComponent
      let callbackId = data.lastPathComponent

      app.emit(event, callbackId)

      // Continue reading until there's no data left.
      readData()
    }
  }

}

