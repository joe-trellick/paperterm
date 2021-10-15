# PaperTerm - a web-based shell/terminal experiment

**NOTE: You should absolutely not run this project in its current state, it will create a gaping security hole on your machine.**

PaperTerm is a toy project that I created during my time at the [Recurse Center](https://www.recurse.com/),
mostly to refresh my knowledge of TypeScript, DOM interactions, WebSockets, and general shell/terminal functionality.

I also wanted to play around with several other long-running frustrations with terminals: specifically, that they
mostly still act like dumb text-based printers, instead of helping you in your workflow.

PaperTerm is different because it:
* Treats each command and its output as a collapsible, rerunnable unit
* Lets you do other things while an earlier command is still running
* Lets you pin previous results to the side of the screen for reference
* Lets you delete mistakes from your command history
* Shows history in the "wrong" direction
* Uses an awful default HTML textbox for input (it's a toy :)

https://user-images.githubusercontent.com/159327/137512822-4258b61f-8fc5-4034-acb3-7b942d07314a.mp4

### Running PaperTerm

**You absolutely shouldn't run this program, since it will let anyone on your network send terminal commands to your machine.**

But if you do want to take it for a spin:

* `npm run build`
* `npm start`
* Browse to [http://localhost:3000](http://localhost:3000)

### Other interesting work in this space

* [Warp](https://www.warp.dev/)
* [smash](http://evmar.github.io/smash/) and [related work](http://evmar.github.io/smash/related.html)
