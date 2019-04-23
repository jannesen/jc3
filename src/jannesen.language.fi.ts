/// <export-interface path="jannesen.language.ts"/>
/// <language code="nl"/>
import * as  $J from "jc3/jannesen";

export const translateError = [
    { errclass: "MessageError",         translator: (err:Error) => err.message },
    { errclass: "InvalidStateError",    translator: "Internal error." },
    { errclass: "NotImplentedError",    translator: "Not implemented." },
    { errclass: "LoadError",            translator: "Error while loading." },
    { errclass: "ConversionError",      translator: "Conversion error." },
    { errclass: "FormatError",          translator: "Format error." },
    { errclass: "ValidateError",        translator: "Validation error." },
    { errclass: "FormError",            translator: "Error in form handeling." },
    { errclass: $J.ServerError,         translator: (err:$J.ServerError) => {
                                                       switch (err.errCode) {
                                                       case "GENERAL-ERROR":   return "Error received from server.";
                                                       case "CONFIG-ERROR":    return "Server configuration error.";
                                                       case "REQUEST-ERROR":   return "Error in the request sent to the server.";
                                                       case "INTERNAL-ERROR":  return "Internal error while communicating with server.";
                                                       case "SERVICE-DOWN":    return "The application is unavailable at the moment. Please try again later.";
                                                       case "NO-ACCESS":       return "You do not have access to the requested data.";
                                                       case "ACCESS-BLOCK":    return "Access to the application is blocked.";
                                                       case "NO-DATA":         return "Data not available or data is removed.";
                                                       }
                                                       return "Error " + err.errCode + " received from server.";
                                                   } },
    { errclass: $J.AjaxError,          translator: (err:$J.AjaxError) => {
                                                       switch (err.errCode) {
                                                       case "HTTP-ERROR":      return "Error http-" + err.httpStatus + " received from server.";
                                                       case "TIMEOUT":
                                                           if (err.callDefinition.method === "GET") {
                                                               return "Timeout while retrieving server data.";
                                                           }

                                                           return "A network failure occurred while communicating with the server." +
                                                                  "The order may have successfully processed, but the result has been lost.\n\n" +
                                                                  "Please confirm that your order has been processed correctly or not.";

                                                       default: return "Error while communicating with server.";
                                                       }
                                                   } }
];

export const btn_cancel                         = /*Cancel*/ "Peruuta";
export const btn_ok                             = /*OK*/ "OK";
export const btn_close                          = /*Close*/ "Sulje";
export const btn_save                           = /*Save*/ "Tallenna";
export const btn_remove                         = /*Remove*/ "Poista";
export const btn_next                           = /*Next*/ "volgende";
export const btn_prev                           = /*Previous*/ "voorgaand";
export const datePlaceHolder                    = /*dd/mm/yyyy*/ "pp/kk/vvvv";
export const dateRangePlaceHolder               = /*dd/mm/yyyy - dd/mm/yyyy*/ "pp/kk/vvvv - pp/kk/vvvv";
export const dayNames                           = ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"];
export const dayNamesShort                      = ["su", "ma", "ti", "ke", "to", "pe", "la"];
export const dayNamesMin                        = ["su", "ma", "ti", "ke", "to", "pe", "la"];
export const deletemessage_title                = /*Are you sure?*/ "Oletko varma?";
export const deletemessage_message              = /*Are you sure you want to delete this?*/ "Oletko varma että haluat poistaa tämän?";
export const details                            = /*Details:*/ "Yksityiskohdat:";
export const errormessage_title                 = /*ERROR*/ "VIRHE";
export const incorrect_integer_value            = (s: string): string => "Virheellinen kokonaisluku " + s + ".";
export const incorrect_boolean_value            = (s: string): string => "Väärä booliarvo " + s + ".";
export const incorrect_numeric_value            = (s: string): string => "Virheellinen numeerinen arvo " + s + ".";
export const input_incomplete                   = /*Input incomplete*/ "Input incomplete";
export const input_invalid                      = /*Input invalid*/ "Puuttuvia tietoja";
export const input_required                     = /*Input required*/ "Pakollinen tieto";
export const invalid_date                       = /*Invalid date*/ "Väärä päivämäärä";
export const invalid_datetime                   = /*Invalid datetime*/ "Väärä päivämäärä ja aika";
export const invalid_time                       = /*Invalid time*/ "Väärä aika";
export const invalid_time_syntax                = /*Invalid time syntax*/ "Käytä kaksoipistettä ajan erottimena";
export const invalid_value_time                 = (s: string): string => "Väärä arvo " + s + " ikakentässä";
export const items_to_few                       = /*To few items*/ "Muutamiin kohteisiin";
export const items_to_many                      = /*To many items*/ "Moniin kohteisiin";
export const loading                            = /*Loading...*/ "Lataa...";
export const message_default_title              = /*Message*/ "Viesti";
export const monthNames                         = ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"];
export const monthNamesShort                    = ["tammi", "helmi", "maalis", "huhti", "touko", "kesä", "heinä", "elo", "syys", "loka", "marras", "joulu"];
export const more_input_necessary               = /*More input necessary*/ "Ei tarpeeksi merkkejä";
export const no                                 = /*No*/ "Ei";
export const no_result                          = /*No result*/ "Ei hakutulosta";
export const text_to_short                      = (n: number): string => "Teksti on liian lyhyt. Minimimäärä on " + n + " merkkiä";
export const text_to_long                       = (n: number): string => "Teksti on liian pitkä. Maksimimäärä on " + n + " merkkiä";
export const unknown_error                      = /*Unknown error*/ "Tuntematon virhe";
export const valuetohigh_message                = /*Value out of range(To high)*/ "Arvo liian korkea";
export const valuetolow_message                 = /*Value out of range(To low)*/ "Arvo liian matala";
export const yes                                = /*Yes*/ "Kyllä";
export const querysearch                        = /*Search*/ "Hae";
export const queryexecute                       = /*Execute*/ "Suorita";
export const invalid_daterange                  = /*Invalid daterange*/ "Väärä päivämäärä";
export const invalid_datetimerange              = /*Invalid datetimerange*/ "Väärä kellonaika";
