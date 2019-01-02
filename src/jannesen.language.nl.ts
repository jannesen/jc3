/// <export-interface path="jannesen.language.ts"/>
/// <language code="nl"/>
import * as  $J from "jc3/jannesen";


export function errorToText(err: Error): string {
    switch (err.name) {
    case "InvalidStateError": return "Interne fout.";
    case "NotImplentedError": return "Niet geïmplementeerd.";
    case "LoadError": return "Fout tijdens laden.";

    case "ServerError":
        switch ((err as $J.ServerError).errCode) {
        case "GENERAL-ERROR": return "Fout ontvangen van server.";
        case "CONFIG-ERROR": return "Server configuratie fout.";
        case "REQUEST-ERROR": return "Fout in de 'request' welke naar de server is gestuurd.";
        case "INTERNAL-ERROR": return "Interne fout tijdens verwerking.";
        case "SERVICE-DOWN": return "De applicatie is niet beschikbaar op het moment. Probeer het later nog eens.";
        case "NO-ACCESS": return "Je hebt geen toegang tot de gevraagde data.";
        case "ACCESS-BLOCK": return "De toegang tot de applicantie is geblokkeerd.";
        case "NO-DATA": return "Gegevens niet beschikbaar / verwijder.";
        }

        return "Fout " + (err as $J.ServerError).errCode + " ontvangen van server.";

    case "AjaxError":
        switch ((err as $J.AjaxError).errCode) {
        case "HTTP-ERROR": return "Error http-" + (err as $J.AjaxError).httpStatus + " ontvangen van server.";

        case "TIMEOUT":
            if ((err as $J.AjaxError).callDefinition.method === "GET") {
                return "Timeout tijdens ophalen data van server.";
            }

            return "Er heeft een netwerkstoring plaats gevonden tijdens het communiceren met de server." +
                   "Het is mogelijk dat je opdracht goed is verwerkt, maar dat het resultaat verloren is gegaan.\n\n" +
                   "We verzoeken je te controleren of de opdracht goed is verwerkt.";

        default: return "Fout tijdens communicatie met server.";
        }

    case "ConversionError": return "Conversie fout.";
    case "FormatError": return "Formaat fout.";
    case "ValidateError": return "Validatie fout.";
    case "FormError": return "Fout in form afhandeling";
    default: return "Error: " + (err as Error).name;
    }
}

export const btn_cancel                         = /*Cancel*/ "Annuleren";
export const btn_ok                             = /*OK*/ "OK";
export const btn_close                          = /*Close*/ "Sluiten";
export const btn_save                           = /*Save*/ "Opslaan";
export const btn_remove                         = /*Remove*/ "Verwijderen";
export const datePlaceHolder                    = /*dd/mm/yyyy*/ "dd/mm/jjjj";
export const dateRangePlaceHolder               = /*dd/mm/yyyy - dd/mm/yyyy*/ "dd/mm/jjjj - dd/mm/jjjj";
export const dayNames                           = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
export const dayNamesShort                      = ["zon", "maa", "din", "woe", "don", "vri", "zat"];
export const dayNamesMin                        = ["zo", "ma", "di", "wo", "do", "vr", "za"];
export const deletemessage_title                = /*Are you sure?*/ "Weet je het zeker?";
export const deletemessage_message              = /*Are you sure you want to delete this?*/ "Weet je zeker dat je dit wilt verwijderen?";
export const errormessage_title                 = /*ERROR*/ "FOUT";
export const incorrect_integer_value            = (s: string): string => "Foutief gehele getal " + s + ".";
export const incorrect_boolean_value            = (s: string): string => "Foutieve boolean waarde " + s + ".";
export const incorrect_numeric_value            = (s: string): string => "Foutief getal " + s + ".";
export const input_incomplete                   = /*Input incomplete*/ "Invoer incompleet";
export const input_invalid                      = /*Input invalid*/ "Invoer ongeldig";
export const input_required                     = /*Input required*/ "Invoer verplicht";
export const invalid_date                       = /*Invalid date*/ "Ongeldige datum";
export const invalid_datetime                   = /*Invalid datetime*/ "Ongeldige datum en tijd";
export const invalid_time                       = /*Invalid time*/ "Ongeldige tijd";
export const invalid_time_syntax                = /*Invalid time syntax*/ "Ongeldige tijd syntax";
export const invalid_value_time                 = (s: string): string => "Ongeldige waarde " + s + " in tijd";
export const items_to_few                       = /*To few items*/ "Te weinig items";
export const items_to_many                      = /*To many items*/ "Te veel items";
export const loading                            = /*Loading...*/ "Laden...";
export const message_default_title              = /*Message*/ "Bericht";
export const monthNames                         = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
export const monthNamesShort                    = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export const more_input_necessary               = /*More input necessary*/ "Meer invoer verwacht";
export const no                                 = /*No*/ "Nee";
export const no_result                          = /*No result*/ "Geen resultaat";
export const text_to_short                      = (n: number): string => "Tekst te kort. Minimum is " + n + " karakters";
export const text_to_long                       = (n: number): string => "Tekst te lang. Maximum is " + n + " karakters";
export const unknown_error                      = /*Unknown error*/ "Onbekende fout";
export const valuetohigh_message                = /*Value out of range(To high)*/ "Waarde buiten bereik(Te hoog)";
export const valuetolow_message                 = /*Value out of range(To low)*/ "Waarde buiten bereik(Te laag)";
export const yes                                = /*Yes*/ "Ja";
export const querysearch                        = /*Search*/ "Zoeken";
export const queryexecute                       = /*Execute*/ "uitvoeren";
export const invalid_daterange                  = /*Invalid daterange*/ "Ongeldige datumbereik";
export const invalid_datetimerange              = /*Invalid datetimerange*/ "Ongeldige datetimerange";
