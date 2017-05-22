import CoreLocation
import Foundation

class MimoGeo: MimoPlugin, CLLocationManagerDelegate {

  var locationManager:CLLocationManager = CLLocationManager()

  override init() {
    super.init()
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    locationManager.requestAlwaysAuthorization()
    locationManager.startUpdatingLocation()
    app.coreLocationController = self
  }

  func locationManager(manager: CLLocationManager!, didUpdateLocations locations: [AnyObject]) {
    var locationArray = locations as NSArray
    var locationObj = locationArray.lastObject as! CLLocation
    var coord = locationObj.coordinate
    var geo = [Double]()
    geo.append(coord.latitude)
    geo.append(coord.longitude)
    app.send("geo", callbackId: "", data: geo)
  }
}
