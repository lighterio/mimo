package mimo.plugins;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

import mimo.core.MimoPlugin;

public class MimoPosition extends MimoPlugin implements SensorEventListener
{

  public String prefix = "IPS-";

  WifiManager wifi;
  BluetoothAdapter bluetooth;
  SensorManager sensor;

  @Override
  public void load() {
    loadWifi();
    loadBluetooth();
    loadSensors();
  }

  public void loadBluetooth() {

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
      bluetooth = BluetoothAdapter.getDefaultAdapter();
      bluetooth.startDiscovery();

      bluetooth.startLeScan(new BluetoothAdapter.LeScanCallback() {

        @Override
        public void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
          device.getAddress();
          JSONObject item = new JSONObject();
          try {
            device.describeContents();
            String address = device.getAddress();
            String name = device.getName();
            item.put("name", name);
            item.put("address", address);
            item.put("rssi", rssi);
          } catch (JSONException e) {
            e.printStackTrace();
          }
          app.send("bluetooth", "", item);
        }
      });
    }

  }

  public void loadWifi() {
    wifi = (WifiManager) app.getSystemService(Context.WIFI_SERVICE);
    if (wifi.isWifiEnabled() == false)
    {
      wifi.setWifiEnabled(true);
    }

    wifi.startScan();

    app.registerReceiver(new BroadcastReceiver() {

      @Override
      public void onReceive(Context context, Intent intent) {
        List<ScanResult> results = wifi.getScanResults();
        JSONArray list = new JSONArray();
        for (ScanResult result : results) {
          if (result.SSID.startsWith(prefix)) {
            JSONObject item = new JSONObject();
            try {
              item.put("ssid", result.SSID);
              item.put("bssid", result.BSSID);
              item.put("frequency", result.frequency);
              item.put("level", result.level);
            } catch (JSONException e) {
              e.printStackTrace();
            }
            list.put(item);
          }
        }
        app.send("wifi", "", list);
      }
    }, new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION));

  }

  public void loadSensors() {
    sensor = (SensorManager) app.getSystemService(Context.SENSOR_SERVICE);
    int delay = SensorManager.SENSOR_DELAY_NORMAL;
    sensor.registerListener(this, sensor.getDefaultSensor(Sensor.TYPE_ACCELEROMETER), delay);
    sensor.registerListener(this, sensor.getDefaultSensor(Sensor.TYPE_GRAVITY), delay);
    sensor.registerListener(this, sensor.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD), delay);
    sensor.registerListener(this, sensor.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR), delay);
    sensor.registerListener(this, sensor.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION), delay);
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    String type = null;
    switch (event.sensor.getType()) {
      case Sensor.TYPE_ACCELEROMETER: type = "accelerometer"; break;
      case Sensor.TYPE_GRAVITY: type = "gravity"; break;
      case Sensor.TYPE_MAGNETIC_FIELD: type = "magnetic"; break;
      case Sensor.TYPE_ROTATION_VECTOR: type = "rotation"; break;
      case Sensor.TYPE_LINEAR_ACCELERATION: type = "linear"; break;
    }
    if (type != null) {
      float[] values = event.values;
      JSONArray data = new JSONArray();
      try {
        data.put(values[0]);
        data.put(values[1]);
        data.put(values[2]);
        app.send(type, "", data);
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    // TODO: Do something.
  }
}