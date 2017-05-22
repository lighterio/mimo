package mimo.plugins;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;

import mimo.core.MimoPlugin;

public class MimoGeo extends MimoPlugin {

  public boolean listening = false;

  /**
   * Overwrite the browser's geolocation object and listen for GPS changes.
   */
  @Override
  public void load() {

    // Acquire a reference to the system Location Manager
    LocationManager manager = (LocationManager) app.getSystemService(Context.LOCATION_SERVICE);

    // Define a listener that responds to location updates
    LocationListener listener = new LocationListener() {

      // When a new location is found by the network location provider, update the position.
      public void onLocationChanged(Location location) {
        app.log(location);
        if (location != null) {
          double latitude = location.getLatitude();
          double longitude = location.getLongitude();
          app.eval("Mimo.emit('geo',[" + latitude + "," + longitude + "])");
        }
      }

      public void onStatusChanged(String provider, int status, Bundle extras) {}

      public void onProviderEnabled(String provider) {}

      public void onProviderDisabled(String provider) {}
    };

    String[] providers = new String[]{
      LocationManager.GPS_PROVIDER,
      LocationManager.NETWORK_PROVIDER,
      LocationManager.PASSIVE_PROVIDER
    };

    for (String provider: providers) {

      // Register the listener with the Location Manager to receive location updates.
      // Require a minimum elapsed time of 10 seconds and minimum distance of 10 meters.
      try {
        manager.requestLocationUpdates(provider, 10000L, 10, listener);
      }
      catch (IllegalArgumentException ignore) {

      }

      // Get an initial reading.
      listener.onLocationChanged(manager.getLastKnownLocation(provider));
    }
  }
}
