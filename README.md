#Paperfold JS

Fold website elements in 3D. Demo: [felixniklas.com/paperfold](http://felixniklas.com/paperfold). It's based on an [experiment](https://developer.mozilla.org/en-US/demos/detail/paperfold-css) from 2011.

##Usage

Include jQuery and paperfold.js in your site.

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script src="/path/to/paperfold.js"></script>
```

Call paperfold on the container you want to fold and bind the fold interaction to a button or any other interaction.

```javascript
$(function() {
	var paperfold = $('.hidden').paperfold();

	$('.paperfold-toggle').click(paperfold.toggle);
});
```

====

[MIT License](LICENSE.md). © Felix Niklas (http://twitter.com/mrflix).