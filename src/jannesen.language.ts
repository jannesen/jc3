/// <language code="en"/>
import * as $J from "jc3/jannesen";

export const btn_cancel                         = "Cancel";
export const btn_ok                             = "OK";
export const btn_close                          = "Close";
export const btn_save                           = "Save";
export const btn_remove                         = "Remove";
export const btn_next                           = "Next";
export const btn_prev                           = "Previous";
export const datePlaceHolder                    = "dd/mm/yyyy";
export const dateRangePlaceHolder               = "dd/mm/yyyy - dd/mm/yyyy";
export const dayNames                           = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const dayNamesShort                      = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const dayNamesMin                        = ["su", "mo", "tu", "we", "th", "fr", "sa"];
export const deletemessage_title                = "Are you sure?";
export const deletemessage_message              = "Are you sure you want to delete this?";
export const errormessage_title                 = "ERROR";
export const incorrect_integer_value            = (s: string) : string => "Incorrect integer value " + s + ".";
export const incorrect_boolean_value            = (s: string) : string => "Incorrect boolean value " + s + ".";
export const incorrect_numeric_value            = (s: string) : string => "Incorrect numeric value " + s + ".";
export const input_incomplete                   = "Input incomplete";
export const input_invalid                      = "Input invalid";
export const input_required                     = "Input required";
export const invalid_date                       = "Invalid date";
export const invalid_datetime                   = "Invalid datetime";
export const invalid_time                       = "Invalid time";
export const invalid_time_syntax                = "Invalid time syntax";
export const invalid_value_time                 = (s: string): string => "Invalid value " + s + " in time";
export const items_to_few                       = "To few items";
export const items_to_many                      = "To many items";
export const loading                            = "Loading...";
export const message_default_title              = "Message";
export const monthNames                         = ["January", "February", "March", "April", "May", "Jun", "July", "August", "September", "October", "November", "December"];
export const monthNamesShort                    = ["jan", "feb", "mrt", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const more_input_necessary               = "More input necessary";
export const no                                 = "No";
export const no_result                          = "No result";
export const text_to_short                      = (n: number): string => "Text to short. Minimum is " + n + " characters";
export const text_to_long                       = (n: number): string => "Text to long. Maximum is " + n + " characters";
export const unknown_error                      = "Unknown error";
export const valuetohigh_message                = "Value out of range(To high)";
export const valuetolow_message                 = "Value out of range(To low)";
export const yes                                = "Yes";
export const querysearch                        = "Search";
export const queryexecute                       = "Execute";
export const invalid_daterange                  = "Invalid daterange";
export const invalid_datetimerange              = "Invalid datetimerange";

export function errorToText(err: Error): string {
    switch (err.name) {
    case "MessageError": return err.message;
    case "InvalidStateError": return "Internal error.";
    case "NotImplentedError": return "Not implemented.";
    case "LoadError": return "Error while loading.";

    case "ServerError":
        switch ((err as $J.ServerError).errCode) {
        case "GENERAL-ERROR": return "Error received from server.";
        case "CONFIG-ERROR": return "Server configuration error.";
        case "REQUEST-ERROR": return "Error in the request sent to the server.";
        case "INTERNAL-ERROR": return "Internal error while communicating with server.";
        case "SERVICE-DOWN": return "The application is unavailable at the moment. Please try again later.";
        case "NO-ACCESS": return "You do not have access to the requested data.";
        case "ACCESS-BLOCK": return "Access to the application is blocked.";
        case "NO-DATA": return "Data not available or data is removed.";
        }

        return "Error " + (err as $J.ServerError).errCode + " received from server.";

    case "AjaxError":
        switch ((err as $J.AjaxError).errCode) {
        case "HTTP-ERROR": return "Error http-" + (err as $J.AjaxError).httpStatus + " received from server.";

        case "TIMEOUT":
            if ((err as $J.AjaxError).callDefinition.method === "GET") {
                return "Timeout while retrieving server data.";
            }

            return "A network failure occurred while communicating with the server." +
                   "The order may have successfully processed, but the result has been lost.\n\n" +
                   "Please confirm that your order has been processed correctly or not.";

        default: return "Error while communicating with server.";
        }

    case "ConversionError": return "Conversion error.";
    case "FormatError": return "Format error.";
    case "ValidateError": return "Validation error.";
    case "FormError": return "Error in form handeling";
    default: return "Error: " + (err as Error).name;
    }
}
