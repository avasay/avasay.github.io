---
layout: post
title:  "Get Random Element From List<T> in C#"
date:   2019-10-30 08:10:00 -0500
categories: dotnet csharp
tags: List Random
comments: true
---

This demo briefly explains how to get random element from a C# ```List<T>```. This example is a ASP.NET console program.<!--more-->


## Application Demo
<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48992235091/in/album-72157711535844827/" title="random-console-1"><img src="https://live.staticflickr.com/65535/48992235091_4c68ac302e_n.jpg" width="480" height="auto" alt="random-console-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Basically, the console simply displays a random string one line at a time. The random part will be either of these three strings: *biology-1, biology-2,* and *biology-3*. 

___
## The Complete Program
```
static void Main(string[] args)
{
    // Initialize our list
    List<string> mylist = new List<string>(new string[] { "biology-1", "biology-2", "biology-3" });

    Random R = new Random();

    // get random number from 0 to 2. 
    int someRandomNumber = R.Next(0, mylist.Count());

    Console.WriteLine("Hello {0}", mylist.ElementAt(someRandomNumber));
    Console.ReadKey();
}
```


### Brief Explanation of the Source Code

I created a list of strings initialized with 3 strings.
```
List<string> mylist = new List<string>(new string[] { "biology-1", "biology-2", "biology-3" });
```
To get a random element, what we want to do is use the ```ElementAt``` method of ```List<T>```, like this,
```
mylist.ElementAt(someRandomNumber)
```
Like arrays, a list has elements whose position starts at 0 and ends at *mylist.Count() - 1*. In this program, we generate the value for **someRandomNumber** by using the Random.Next method 
```
int someRandomNumber = R.Next(0, mylist.Count());
```
to get a random number from 0 to *mylist.Count()-1*. In my example, since I have three elements, I want a random number from **0 to 2**. Element #3 does not exist!

### Source Code
Download source code **[here][get-random-element]**. This project was created in Visual Studio Community 2019.

[get-random-element]: https://github.com/avasay/GetRandomElementFromList