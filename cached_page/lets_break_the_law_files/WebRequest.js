/// <reference name="MicrosoftAjax.js"/>

Type.registerNamespace('Cdn2015');
Cdn2015.WebRequest = function() {
  this._url = "";
  this._displayElement = "";
}
Cdn2015.WebRequest.prototype =
{
  GET: function(url, callbackFunction) {
    try {
      // show different error exceptions that you can throw
      if (url === undefined) throw Error.argumentUndefined('url');
      if (url === "") throw Error.argumentUndefined('url', "You cannot add an url that is blank");
      if (url === null) throw Error.argumentNull('url');

      // Instantiate the WebRequest object.
      var wRequest = new Sys.Net.WebRequest();

      wRequest.set_url(url);

      // Set the request verb.
      wRequest.set_httpVerb("GET");

      // Set user's context
      wRequest.set_userContext("user's context");

      // Set the request handler.
      wRequest.add_completed(callbackFunction);

      // Execute the request.
      wRequest.invoke();
    }
    catch (e) {
        alert("繁簡轉換錯誤：" + e.message);
    }
  }

}

Cdn2015.WebRequest.registerClass('Cdn2015.WebRequest');

