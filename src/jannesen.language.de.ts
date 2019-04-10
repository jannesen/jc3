/// <export-interface path="jannesen.language.ts"/>
/// <language code="de"/>
import * as  $J  from "jc3/jannesen";

export function errorToText(err: Error): string {
    switch (err.name) {
    case "MessageError":        return err.message;
    case "InvalidStateError":   return "Internal error.";
    case "NotImplentedError":   return "Not implemented.";
    case "LoadError":            return "Error while loading.";

    case "ServerError":
        switch ((err as $J.ServerError).errCode) {
        case "GENERAL-ERROR":   return "Error received from server.";
        case "CONFIG-ERROR":    return "Server configuration error.";
        case "REQUEST-ERROR":   return "Error in the request sent to the server.";
        case "INTERNAL-ERROR":  return "Internal error while communicating with server.";
        case "SERVICE-DOWN":    return "The application is unavailable at the moment. Please try again later.";
        case "NO-ACCESS":       return "You do not have access to the requested data.";
        case "ACCESS-BLOCK":    return "Access to the application is blocked.";
        case "NO-DATA":         return "Data not available or data is removed.";
        }

        return "Error " + (err as $J.ServerError).errCode + " received from server.";

    case "AjaxError":
        switch ((err as $J.AjaxError).errCode) {
        case "HTTP-ERROR":      return "Error http-" + (err as $J.AjaxError).httpStatus + " received from server.";

        case "TIMEOUT":
            if ((err as $J.AjaxError).callDefinition.method === "GET") {
                return "Timeout while retrieving server data.";
            }

            return "A network failure occurred while communicating with the server." +
                   "The order may have successfully processed, but the result has been lost.\n\n" +
                   "Please confirm that your order has been processed correctly or not.";

        default: return "Error while communicating with server.";
        }

    case "ConversionError":     return "Conversion error.";
    case "FormatError":         return "Format error.";
    case "ValidateError":       return "Validation error.";
    case "FormError":           return "Error in form handeling";
    default:                    return "Error: " + (err as Error).name;
    }
}

export const btn_cancel                         = /*Cancel*/ "Stornieren";
export const btn_ok                             = /*OK*/ "OK";
export const btn_close                          = /*Close*/ "Schließen";
export const btn_save                           = /*Save*/ "sparen";
export const btn_remove                         = /*Remove*/ "Löschen";
export const btn_next                           = /*Next*/ "Nächster";
export const btn_prev                           = /*Previous*/ "Bisherige";
export const datePlaceHolder                    = /*dd/mm/yyyy*/ "DD / MM / JJJJ";
export const dateRangePlaceHolder               = /*dd/mm/yyyy - dd/mm/yyyy*/ "TT / MM / JJJJ - TT / MM / JJJJ";
export const dayNames                           = [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const dayNamesShort                      = [ "so", "mo", "di", "mi", "do", "fr", "sa" ];
export const dayNamesMin                        = [ "so", "mo", "di", "mi", "do", "fr", "sa" ];
export const deletemessage_title                = /*Are you sure?*/ "Bist du sicher?";
export const deletemessage_message              = /*Are you sure you want to delete this?*/ "Möchten Sie das wirklich löschen?";
export const errormessage_title                 = /*ERROR*/ "ERROR";
export const incorrect_integer_value            = (s: string): string => "Falscher ganzzahliger Wert " + s + ".";
export const incorrect_boolean_value            = (s: string): string => "Falscher boolescher Wert " + s + ".";
export const incorrect_numeric_value            = (s: string): string => "Falscher numerischer Wert " + s + ".";
export const input_incomplete                   = /*Input incomplete*/ "Eingabe unvollständig";
export const input_invalid                      = /*Input invalid*/ "Eingabe ungültig";
export const input_required                     = /*Input required*/ "Eingabe erforderlich";
export const invalid_date                       = /*Invalid date*/ "Ungültiges Datum";
export const invalid_datetime                   = /*Invalid datetime*/ "Ungültige Datumszeit";
export const invalid_time                       = /*Invalid time*/ "Ungültige Zeit";
export const invalid_time_syntax                = /*Invalid time syntax*/ "Ungültige Zeitsyntax";
export const invalid_value_time                 = (s: string): string => "Ungültiger Wert '" + s + "' in der Zeit";
export const items_to_few                       = /*To few items*/ "Zu wenigen Artikeln";
export const items_to_many                      = /*To many items*/ "Zu vielen Artikeln";
export const loading                            = /*Loading...*/ "Wird geladen...";
export const message_default_title              = /*Message*/ "Botschaft";
export const monthNames                         = [ "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember" ];
export const monthNamesShort                    = [ "jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez" ];
export const more_input_necessary               = /*More input necessary*/ "Weitere Eingaben sind erforderlich";
export const no                                 = /*No*/ "Nein";
export const no_result                          = /*No result*/ "Kein Ergebnis";
export const text_to_short                      = (n: number): string => "Text zu kurz. Minimum ist " + n + " Zeichen";
export const text_to_long                       = (n: number): string => "Text zu lang. Maximal ist " + n + " Zeichen";
export const unknown_error                      = /*Unknown error*/ "Unbekannter Fehler";
export const valuetohigh_message                = /*Value out of range(To high)*/ "Wert außerhalb des Bereichs (zu hoch)";
export const valuetolow_message                 = /*Value out of range(To low)*/ "Wert außerhalb des Bereichs (zu niedrig)";
export const yes                                = /*Yes*/ "Ja";
export const querysearch                        = /*Search*/ "Suche";
export const queryexecute                       = /*Execute*/ "Ausführen";
export const invalid_daterange                  = /*Invalid daterange*/ "Ungültige Datumsangabe";
export const invalid_datetimerange              = /*Invalid datetimerange*/ "Ungültiger Datumsbereich";
