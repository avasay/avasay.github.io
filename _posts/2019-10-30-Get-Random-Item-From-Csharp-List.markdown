---
layout: post
title:  "Get Random Element From C# List"
date:   2019-10-30 08:10:00 -0500
categories: csharp dotnet
tags: List Random
---

This demo briefly and quickly explains how to get random element from a C# list. This example is a ASP.NET console program.

Let's say that we have a list of strings initialized with 3 strings.
```
List<string> mylist = new List<string>(new string[] { "biology-1", "biology-2", "biology-3" });
```
Like arrays, Lists have elements whose position starts at 0 and ends at *mylist.Count() - 1*.
So, to get a random element, what we want to do is 
```
mylist.ElementAt(someRandomNumber)
```
In this program, we generate **someRandomNumber** by using the Random.Next method to get a random number from 0 to *mylist.Count()-1*. 

___
## The complete program
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


