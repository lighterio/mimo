package mimo.plugins;

import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import android.provider.ContactsContract.Contacts;
import java.util.HashMap;
import java.util.Map;
import mimo.core.MimoListener;
import mimo.core.MimoPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MimoContacts extends MimoPlugin {

  @Override
  public void init() {
    app.on("contacts", new MimoListener() {

      @Override
      public void run(String callbackId) {
        JSONArray contacts;
        try {
          contacts = getContacts();
        } catch (JSONException error) {
          app.log(error);
          contacts = new JSONArray();
        }
        app.send("contacts", callbackId, contacts);
      }

    });
  }

  private JSONArray getContacts() throws JSONException {
    JSONArray contacts = new JSONArray();
    Map<String, JSONArray> phoneMap = getMap(Phone.CONTENT_URI, Phone.CONTACT_ID, Phone.DATA);
    Map<String, JSONArray> emailMap = getMap(Email.CONTENT_URI, Email.CONTACT_ID, Email.DATA);

    Cursor cursor = queryAll(Contacts.CONTENT_URI);
    if (cursor.getCount() > 0) {

      // Set up indexes for each column that we'll want.
      int idIndex = cursor.getColumnIndex(Contacts._ID);
      int nameIndex = cursor.getColumnIndex(Contacts.DISPLAY_NAME);
      int photoIndex = cursor.getColumnIndex(Contacts.PHOTO_THUMBNAIL_URI);
      int timesIndex = cursor.getColumnIndex(Contacts.TIMES_CONTACTED);
      int lastIndex = cursor.getColumnIndex(Contacts.LAST_TIME_CONTACTED);
      int mainIndex = cursor.getColumnIndex(Contacts.IN_DEFAULT_DIRECTORY);

      // Iterate over contacts.
      while (cursor.moveToNext()) {

        // Prepare an object to store the data.
        JSONObject contact = new JSONObject();

        // Get information that we know we can get.
        String id = cursor.getString(idIndex);
        String name = cursor.getString(nameIndex);

        // Set defaults for information we might not get.
        String photo = null;
        int times = 0;
        int last = 0;
        int main = 0;

        // Some fields aren't supported on older devices.
        try {
          photo = cursor.getString(photoIndex);
          main = cursor.getInt(mainIndex);
          times = cursor.getInt(timesIndex);
          last = cursor.getInt(lastIndex);
        }
        catch (IllegalStateException ignore) {
        }

        contact.put("id", id);
        contact.put("name", name);
        if (photo != null) {
          contact.put("photo", photo);
        }
        if (times > 0) {
          contact.put("times", times);
        }
        if (last > 0) {
          contact.put("last", last);
        }
        if (main > 0) {
          contact.put("main", main);
        }

        JSONArray phones = phoneMap.get(id);
        if (phones != null) {
          contact.put("phones", phones);
        }
        JSONArray emails = emailMap.get(id);
        if (emails != null) {
          contact.put("emails", emails);
        }
        contacts.put(contact);
      }
    }
    cursor.close();
    app.log(contacts.length());
    return contacts;
  }

  private Cursor queryAll(Uri contentUri) {
    return app.getContentResolver().query(contentUri, null, null, null, null);
  }

  private HashMap<String, JSONArray> getMap(Uri contentUri, String idColumn, String valueColumn) {
    HashMap<String, JSONArray> map = new HashMap();
    Cursor cursor = queryAll(contentUri);
    int idIndex = cursor.getColumnIndex(idColumn);
    int valueIndex = cursor.getColumnIndex(valueColumn);
    if (cursor.getCount() > 0) {
      while (cursor.moveToNext()) {
        String id = cursor.getString(idIndex);
        String value = cursor.getString(valueIndex);
        JSONArray list = map.get(id);
        if (list == null) {
          list = new JSONArray();
          map.put(id, list);
        }
        list.put(value);
      }
    }
    cursor.close();
    return map;
  }

}

