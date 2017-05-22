import AddressBook
import UIKit

class MimoContacts: MimoPlugin {

  // Contact photos are cached in an app-specific temp directory.
  var temp = NSTemporaryDirectory()

  // Contacts come from the device's address book.
  var addressBook: ABAddressBookRef? = {
    var error: Unmanaged<CFErrorRef>?
    var addressBook: ABAddressBookRef? = ABAddressBookCreateWithOptions(nil, &error)?.takeRetainedValue()
    if (error != nil) {
      addressBook = nil
    }
    return addressBook
  }()

  /**
   * When the contacts plugin is created, listen for contacts requests.
   */
  override init () {
    super.init()
    app.on("contacts", getAll)
  }

  /**
   * Get the user's permission to access their address book.
   */
  func authorize() -> Bool {
    var error: Unmanaged<CFErrorRef>?
    var authorized: Bool = false

    if addressBook != nil {
      let authStatus = ABAddressBookGetAuthorizationStatus()
      if authStatus == ABAuthorizationStatus.NotDetermined || authStatus == ABAuthorizationStatus.Authorized {

        // Lock and wait until the OS responds or user accepts via permission dialog.
        var lock = dispatch_semaphore_create(0)
        ABAddressBookRequestAccessWithCompletion(addressBook, {(success, error) in
          authorized = success && (error == nil)
          dispatch_semaphore_signal(lock)
        })
        dispatch_semaphore_wait(lock, DISPATCH_TIME_FOREVER)
      }
    }
    return authorized
  }

  /**
   * Get the full list of contacts as JSON.
   */
  func getAll(callbackId: String) {
    var contacts = [AnyObject]()

    if authorize() {
      var records: NSArray = ABAddressBookCopyArrayOfAllPeople(addressBook).takeRetainedValue() as NSArray
      for record in records {
        var contact = getOne(record)
        contacts.append(contact)
      }
    }

    // Send the contact list via its callback.
    app.send("contacts", callbackId: callbackId, data: contacts)
  }

  /**
   * Get a single contact as JSON.
   */
  func getOne(record: ABRecordRef) -> [String: AnyObject] {
    var fields = [String: AnyObject]()

    // Composite name is comprised of prefix, suffix, first and last name.
    var name = ABRecordCopyCompositeName(record)?.takeRetainedValue() as? String
    if name == nil {
      // If composite isn't found, we can construct it from the first and last name.
      var first = ABRecordCopyValue(record, kABPersonFirstNameProperty)?.takeRetainedValue() as? String
      var last = ABRecordCopyValue(record, kABPersonLastNameProperty)?.takeRetainedValue() as? String
      name = (first == nil ? "" : first!) + (last == nil ? "" : " " + last!)
    }
    fields["name"] = name

    if ABPersonHasImageData(record) {
      if var photo = ABPersonCopyImageDataWithFormat(record, kABPersonImageFormatThumbnail)?.takeRetainedValue() {
        var image = UIImage(data: photo)
        var id = ABRecordGetRecordID(record)
        fields["id"] = id.description
        var path = temp + "contact" + id.description + ".jpg"
        fields["photo"] = path

        var priority = DISPATCH_QUEUE_PRIORITY_DEFAULT
        dispatch_async(dispatch_get_global_queue(priority, 0)) {
          var jpg = UIImageJPEGRepresentation(image, 1.0)
          jpg.writeToFile(path, atomically: true)
        }

      }
    }

    // Some properties can have multiple values (e.g. work and home).
    var phones = getValues(record, property: kABPersonPhoneProperty)
    if !phones.isEmpty {
      fields["phones"] = phones
    }
    var emails = getValues(record, property: kABPersonEmailProperty)
    if !emails.isEmpty {
      fields["emails"] = emails
    }

    return fields
  }

  /**
   * Get an array of values (such as phones or emails) as JSON.
   */
  func getValues(record: ABRecordRef, property: ABPropertyID) -> [String] {
    var results = [String]()
    if let values: ABMultiValueRef? = ABRecordCopyValue(record, property)?.takeRetainedValue() {
      for i in 0 ..< ABMultiValueGetCount(values) {
        var value = ABMultiValueCopyValueAtIndex(values, i)?.takeRetainedValue() as? String
        if value != nil {
          results.append(value!)
        }
      }
    }
    return results
  }
}
