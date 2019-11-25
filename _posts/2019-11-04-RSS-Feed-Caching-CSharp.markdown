---
layout: post
title:  "Caching Using RemovedCallback in C#"
date:   2019-11-04 08:10:00 -0500
categories: dotnet csharp
tags: caching rss httphandler
comments: true
---
This demo is an example of **RSS Caching** with an implementation of **RemovedCallback** function --- trigered when an item is removed from cache. This is very similar to an application that I did for our organization. Basically, our *News* server lives on a different server separate from our main site. My RSS cacher application caches the RSS data, and re-caches it on a regular basis, dictated by the caching policy.<!--more-->

At some point, the data cannot stay in the cache forever, and needs to be reloaded from the RSS site. So, we specified an expiration policy in the application. For this demo though, I specified a cache exipration of 60 seconds. The re-loading and re-caching of the RSS data is a sort of an eternal loop that is a necessity to keep the feed up to date. To make this all possible, I'm using a callback function when the item is removed from cache. This is accomplished using ```System.Web.Caching.CacheItemRemovedCallback``` method.

___
## Application Demo

For this demo, I'm using one of my favorite stock market websites called [SeekingAlpha][seeking-alpha] as the source of my RSS data feed. And I made the app a little simpler.

So, when you load the application in the browser, a **Get Feed** button is displayed. Below the button is an iframe. 

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49018554803/in/dateposted-public/" title="rss-1"><img src="https://live.staticflickr.com/65535/49018554803_5f212dc50e_n.jpg" width="640" height="auto" alt="rss-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

After you click the button, you'll see the XML file displayed (I'm using a simple JQuery script to load the feed into the iframe).

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49018554778/in/dateposted-public/" title="rss-2"><img src="https://live.staticflickr.com/65535/49018554778_a87fb12f64_n.jpg" width="640" height="auto" alt="rss-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

### Program Flow

1. button is clicked
2. application reads the RSS feed from the specified website 
3. application caches the RSS data in the server, expiration **countdown** begins!. 
4. application displays XML feed in iframe
5. cache expires in the server after a specified time and RSS data is removed from the cache
6. application re-reads and re-caches RSS data again --- this ensures feed is updated

#### **What happens when you click "Get Feed" again?**

You can click "Get Feed" over and over and it will return to you what's already in the cache, provided cache has not expired. Otherwise, when the countdown ends (my 60 seconds finishes), the program goes back to step #5 above, RSS data is re-loaded and re-cached --- and countdown begins again.
    


___
## Program Setup
In Visual Studio, create the following: 
1. **A web application**, *ASP.NET Web Application (.NET Framework)*. I called my application, *RSSCaching*.
2. **A generic handler**, and simply call it *Handler.ashx*. 
3. **A class** called *RSSData.cs* - this is the class that encapsulates everything about the RSS - its key, and the data itself.
4. **A class** called *RSSCacher.cs* - instantiates and caches RSSData objects. 
5. **A Razor Web Page** called index.cshtml. 

My project looks like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49019671387/in/dateposted-public/" title="rss-3"><img src="https://live.staticflickr.com/65535/49019671387_a476d4b88a_n.jpg" width="246" height="294" alt="rss-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

___
## RSSData

This is how my RSSData.cs looks like:

```
public class RSSData
{
    public string Key { get; set; }
    public string XMLData { get; set; }
    public RSSData(string key, string data)
    {
        Key = key;
        XMLData = data;
    }

    public void UpdateCache(RSSCacher sender)
    {
        try
        {

            HttpRuntime.Cache.Insert(Key,
                this,
                null,
                DateTime.Now.AddSeconds(60),
                System.Web.Caching.Cache.NoSlidingExpiration,
                CacheItemPriority.Default,
                new CacheItemRemovedCallback(sender.RemovedCallback));
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error inserting feed data into cache. " + ex.Message);
        }
    }

}
```

### Brief Explanation

The *Key* identifies the cache, and is actually the URL of the RSS feed. The XMLData is the feed itself. 

The ```UpdateCache``` method of the class inserts RSSData itself in the cache by calling the ```HttpRuntime.Cache.Insert``` method --- thus,  I'm passing **this** in the second parameter. Also, as you can see, my expiration policy is 60 seconds, and because this is an absolute expiration, I must use ```System.Web.Caching.Cache.NoSlidingExpiration```. The last parameter tells the application what function or method it should invoke when an item (our RSS data) has been removed from the cache, so we specify our ```RemovedCallback``` function I implemented inside the RSSCacher, which I will explain next.   

___
## RSSCacher
The RSSCacher class looks like this:
```
public class RSSCacher
{
    public CacheItemRemovedReason Reason { get; set; }


    public RSSCacher()
    {
    }

    public string GetFeed(string key)
    {
        RSSData rssData = HttpRuntime.Cache.Get(key) as RSSData;
        if (rssData != null) 
        {                               
            return rssData.XMLData;
        }
        else              
        {
            using (HttpClient client = new HttpClient())
            {
                
                var uri = new Uri(key);
                HttpResponseMessage content = client.GetAsync(uri).Result;
                string xmlData = content.Content.ReadAsStringAsync().Result;

                rssData = new RSSData(key, xmlData);
                rssData.UpdateCache(this);

                return rssData.XMLData;
            }
        }
    }


    public void RemovedCallback(String k, Object v, CacheItemRemovedReason r)
    {
        Reason = r; // Using Reason for unit testing
        var rss = v as RSSData;
        if (r != CacheItemRemovedReason.Expired) // If reason is other than "Expired" do nothing.
        {
            return;
        }


            GetFeed(k);
        
    }
}
```

### Brief Explanation

The ```GetFeed(string key)``` method is the meat of the RSSCacher. First, we retrieve the cache with the given URL key.
```
RSSData rssData = HttpRuntime.Cache.Get(key) as RSSData;
```
We store the cache as RSSData object. Then, we check if that item exists or not. 
```
if (rssData != null) 
{                               
    return rssData.XMLData;
}
else
{
    //Read RSS Feed
    // Build cache
}
```
If it's not null --- if cache exists --- then we just return that cache, as simple as that. However, if cache does not exist, then we start building our cache. 

First step is to actually read the RSS feed from the given URL using the ```HttpClient``` object.
```
using (HttpClient client = new HttpClient())
{
    
    var uri = new Uri(key);
    HttpResponseMessage content = client.GetAsync(uri).Result;
    string xmlData = content.Content.ReadAsStringAsync().Result;
``` 

As you can see, it's a 3-step process:
1. Create a ```Uri``` object out of our URL key.
2. Pass that ```Uri``` object to ```HttpClient.GetAsync``` method. Store the result into an ```HttpResponseMessage``` object.
3. Finally, read the content as string.

Now, that we have our feed, we create a new RSSData object, given the URL key and the feed. 
```
rssData = new RSSData(key, xmlData);
```
Then, we call the ```UpdateCache``` method to insert the RSSData object into the cache.
```
rssData.UpdateCache(this);
```
And finally, we return the feed back to the caller (the Handler.ashx). 

The ```RemovedCallback``` method or function of the RSSCacher class is what is invoked when our RSS data get removed from the cache. This method practically calls the ```GetFeed(string key)``` method again to re-build the cache. I added a little check,
```
if (r != CacheItemRemovedReason.Expired) 
{
    return;
}
```
as a catch-all condition in case "Expired" is not the reason for a callback. I never really run into this during my testing so we can probably remove it.

___
## The Handler
The handler is very simple,
```
public class Handler : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/xml";

        RSSCacher rssCacher = new RSSCacher();
        string feed = rssCacher.GetFeed(@"https://seekingalpha.com/market_currents.xml");

        context.Response.Write(feed);
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
```
It creates an RSSCacher objects, and then call its GetFeed method, passing along the RSS website. First, though, we set the ContentType,
```
context.Response.ContentType = "text/xml";
```
This effectively sends our data as well-formatted XML to the browser. Then, we instantiate the RSSCacher like this,
```
RSSCacher rssCacher = new RSSCacher();
```
Next, we call its ```GetFeed``` method, which is the meat of the RSSCacher object. 
```
string feed = rssCacher.GetFeed(@"https://seekingalpha.com/market_currents.xml");
```
As you can see, we pass the URL of the RSS site to it. Then, what we get back is the XML feed as string. Finally, we return this string to the index page (index.cshtml) with
```
context.Response.Write(feed);
```

___
## The Index Page
The index.cshtml calls the handler within a JQuery, and it looks like this:
```
<!DOCTYPE html>
<html>
<head>
    <title>RSS Caching</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
    <script>
    $(document).ready(function () {
        $("#submit").on('click', function (e) {         
            $("#myiFrame").attr("src", "https://localhost:44306/Handler.ashx"); 
        });
    });
    </script>
</head>
<body>
    <h2>Seeking Alpha Feed</h2>

    <button id="submit">Get Feed</button>
    <p></p>
    <iframe id="myiFrame" src="about:blank" width="720" height="480">
    </iframe>

</body>
</html>
```
As you can see inside the ```<body>``` tag, I have two objects --- the ```<button>``` and the ```<iframe```> tag. The JQuery script that populates the iframe is
```
$("#submit").on('click', function (e) {         
    $("#myiFrame").attr("src", "https://localhost:44306/Handler.ashx"); 
});
```
I simply use the ```src``` attribute and set it to the RSS URL, in turn, loading the data into the iframe window.


### And, that is pretty much it. 
I hope it helps you a little with what you're trying to do.

### Source Code
Download source code **[here][project-download]**. This project was created using Visual Studio Comminity 2019.

[project-download]: https://github.com/avasay/RSSCaching


[seeking-alpha]: https://seekingalpha.com