import React, { Component } from "react";
import { connect } from "redux-zero/react";
import Post from "./Post";
import AtMentionsPopup from "./AtMentionsPopup";
import AddCommentPopup from "./AddCommentPopup";
import ContentEditable from "react-contenteditable";
import { CompositeDisposable } from "atom";
import createClassString from "classnames";
import DateSeparator from "./DateSeparator";

export class SimpleStream extends Component {
	subscriptions = null;

	constructor(props) {
		super(props);
		this.state = {
			stream: {},
			posts: [
				{
					id: 1,
					author: "akonwi",
					body: "this is a post",
					timestamp: 1410650773000,
					email: "akonwi@codestream.com"
				},
				{
					id: 2,
					author: "jj",
					body: "this is another post",
					timestamp: 1411680773000,
					email: "jj@codestream.com"
				},
				{
					id: 3,
					author: "marcelo",
					body:
						"because of the way browsers work, @pez although this will change the scrollbar thumb position, it will not change what @akonwi is looking at (i.e. posts won't shift around).",
					timestamp: 1501650773000,
					email: "marcelo@codestream.com"
				}
			],
			authors: [
				{ id: 1, nick: "pez", fullName: "Peter Pezaris", email: "pez@codestream.com" },
				{
					id: 2,
					nick: "marcelo",
					fullName: "Marcelo Bukowski de Farias",
					email: "marcelo@codestream.com"
				},
				{ id: 3, nick: "akonwi", fullName: "Akonwi Ngoh", email: "akonwi@codestream.com" },
				{ id: 4, nick: "jj", fullName: "James Price", email: "jj@codestream.com" },
				{ id: 5, nick: "colin", fullName: "Colin Stryker", email: "colin@codestream.com" }
			]
		};

		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(
			atom.commands.add(".codestream .compose.mentions-on", {
				"codestream:at-mention-move-up": event => this.handleAtMentionKeyPress(event, "up"),
				"codestream:at-mention-move-down": event => this.handleAtMentionKeyPress(event, "down"),
				"codestream:at-mention-escape": event => this.handleAtMentionKeyPress(event, "escape")
			})
		);
	}

	render() {
		const posts = this.state.posts;
		const streamClass = createClassString({
			stream: true,
			"no-headshots": !atom.config.get("CodeStream.showHeadshots")
		});
		const composeClass = createClassString({
			compose: true,
			"mentions-on": this.state.atMentionsOn
		});

		let newPostText = this.state.newPostText || "";

		// strip out the at-mention markup, and add it back.
		// newPostText = newPostText.replace(/(@\w+)/g, '<span class="at-mention">$1</span> ');

		let quoteInfo = this.state.quoteText ? <div className="code">{this.state.quoteText}</div> : "";
		// FIXME loc
		let range = this.state.quoteRange;
		let rangeText = null;
		if (range) {
			if (range.start.row == range.end.row) {
				rangeText = "Commenting on line " + (range.start.row + 1);
			} else {
				rangeText = "Commenting on lines " + (range.start.row + 1) + "-" + (range.end.row + 1);
			}
		}
		let quoteHint = rangeText ? (
			<div className="hint">
				{rangeText}
				<span onClick={this.handleClickDismissQuote} class="icon icon-x" />
			</div>
		) : (
			""
		);

		let lastTimestamp = null;

		return (
			<div className={streamClass}>
				<div className="postslist">
					{posts.map(post => {
						const returnValue = (
							<div>
								<DateSeparator timestamp1={lastTimestamp} timestamp2={post.timestamp} />
								<Post post={post} lastDay={lastTimestamp} key={post.id} />
							</div>
						);
						lastTimestamp = post.timestamp;
						return returnValue;
					})}
				</div>
				<AddCommentPopup handleClickAddComent={this.handleClickAddComment} />
				<AtMentionsPopup
					on={this.state.atMentionsOn}
					people={this.state.atMentionsPeople}
					prefix={this.state.atMentionsPrefix}
					selected={this.state.selectedAtMention}
					handleHoverAtMention={this.handleHoverAtMention}
					handleSelectAtMention={this.handleSelectAtMention}
				/>
				<div className={composeClass} onKeyPress={this.handleOnKeyPress}>
					<ContentEditable
						className="native-key-bindings"
						id="input-div"
						rows="1"
						tabIndex="-1"
						onChange={this.handleOnChange}
						html={newPostText}
					/>
					{quoteHint}
					{quoteInfo}
				</div>
			</div>
		);
	}
	// {postTextArray.map(fragment => {
	// 	console.log("FRAGMENT IS: " + fragment);
	// 	return fragment;
	// })}
	// onChange={e => this.setState({ newPostText: e.target.innerText })}

	setNewPostText(text) {
		// text = text.replace(/<span class="at-mention">(@\w+)<\/span> /g, "$1");
		// text = text.replace(/(@\w+)/g, <span class="at-mention">$1</span>);
		this.setState({ newPostText: text });
	}

	handleClickDismissQuote = () => {
		// not very React-ish but not sure how to set focus otherwise
		document.getElementById("input-div").focus();

		this.setState({
			quoteText: "",
			quoteRange: null
		});
	};

	addBlameAtMention(selectionRange, gitData) {
		// console.log(data);
		var authors = [];
		for (var lineNum = selectionRange.start.row; lineNum <= selectionRange.end.row; lineNum++) {
			var lineData = gitData[lineNum - 1];
			if (lineData) {
				var author = lineData["author"];
				if (author !== "Not Committed Yet" && author !== "Peter Pezaris") {
					authors.push(author);
				}
			}
		}
		authors = _.uniq(authors);
		console.log("AUTHORS ARE: " + authors);
		if (authors.length > 0) {
			var newText = authors.join(", ") + ": " + this.state.newPostText;
			this.setNewPostText(newText);
		}
	}

	handleClickAddComment = () => {
		// not very React-ish but not sure how to set focus otherwise
		document.getElementById("input-div").focus();

		let editor = atom.workspace.getActiveTextEditor();
		if (!editor) return;

		var range = editor.getSelectedBufferRange();
		let code = editor.getSelectedText();
		// if there is no selected text, i.e. it is a 0-width range,
		// then grab the current line of code that the cursor is on
		if (code.length == 0 && range.start.row == range.end.row) {
			let lineRange = [[range.start.row, 0], [range.start.row, 10000]];
			code = editor.getTextInBufferRange(lineRange);
		}
		this.setState({
			quoteRange: range,
			quoteText: code
		});
	};

	handleOnChange = async event => {
		var newPostText = event.target.value;

		// FIXME -- this should anchor at the carat, not end-of-line
		var match = newPostText.match(/@([a-zA-Z]*)$/);
		if (this.state.atMentionsOn) {
			if (match) {
				var text = match[0].replace(/@/, "");
				this.showAtMentionSelectors(text);
			} else {
				// if the line doesn't end with @word, then hide the popup
				this.setState({ atMentionsOn: false });
			}
		} else {
			if (match) {
				var text = match[0].replace(/@/, "");
				this.showAtMentionSelectors(text);
			}
		}
		this.setNewPostText(newPostText);
	};

	handleOnKeyPress = async event => {
		var newPostText = this.state.newPostText;

		console.log("ON KEYPRESS");
		// if we have the at-mentions popup open, then the keys
		// do something different than if we have the focus in
		// the textarea
		if (this.state.atMentionsOn) {
			if (event.key == "Escape") {
				this.hideAtMentionSelectors();
			} else if (event.key == "Enter" && !event.shiftKey) {
				event.preventDefault();
				this.selectFirstAtMention();
			} else {
				var match = newPostText.match(/@([a-zA-Z]*)$/);
				var text = match ? match[0].replace(/@/, "") : "";
				// this.showAtMentionSelectors(text);
			}
		} else if (event.key == "@") {
			this.showAtMentionSelectors("");
		} else if (event.key == "Escape") {
			this.slideThreadOut();
		} else if (event.key == "Enter" && !event.shiftKey) {
			event.preventDefault();
			if (newPostText.length > 0) {
				this.submitPost(newPostText);
			} else {
				// don't submit blank posts
			}
		}
	};

	selectFirstAtMention() {
		this.handleSelectAtMention();
	}

	showAtMentionSelectors(prefix) {
		let peopleToShow = [];

		for (var index = 0; index < this.state.authors.length; index++) {
			let person = this.state.authors[index];
			let toMatch = person.fullName + "*" + person.nick; // + "*" + person.email;
			let lowered = toMatch.toLowerCase();
			if (lowered.indexOf(prefix) !== -1) {
				peopleToShow.push(person);
			}
		}

		if (peopleToShow.length == 0) {
			this.setState({
				atMentionsOn: false
			});
		} else {
			let selected = peopleToShow[0].nick;

			this.setState({
				atMentionsOn: true,
				atMentionsPrefix: prefix,
				atMentionsPeople: peopleToShow,
				atMentionsIndex: 0,
				selectedAtMention: selected
			});
		}
	}

	handleAtMentionKeyPress(event, eventType) {
		if (eventType == "escape") {
			this.setState({
				atMentionsOn: false
			});
		} else {
			let newIndex = 0;
			if (eventType == "down") {
				if (this.state.atMentionsIndex < this.state.atMentionsPeople.length - 1) {
					newIndex = this.state.atMentionsIndex + 1;
				} else {
					newIndex = 0;
				}
			} else if (eventType == "up") {
				if (this.state.atMentionsIndex == 0) {
					newIndex = this.state.atMentionsPeople.length - 1;
				} else {
					newIndex = this.state.atMentionsIndex - 1;
				}
			}
			this.setState({
				atMentionsIndex: newIndex,
				selectedAtMention: this.state.atMentionsPeople[newIndex].nick
			});
		}
	}

	handleHoverAtMention = nick => {
		let index = this.state.atMentionsPeople.findIndex(x => x.nick == nick);

		console.log(index);
		this.setState({
			atMentionsIndex: index,
			selectedAtMention: nick
		});
	};

	handleSelectAtMention = nick => {
		// if no nick is passed, we assume that we're selecting
		// the currently-selected at mention
		if (!nick) {
			nick = this.state.selectedAtMention;
		}

		// otherwise explicitly use the one passed in
		// FIXME -- this should anchor at the carat, not end-of-line
		var re = new RegExp("@" + this.state.atMentionsPrefix + "$");
		let text = this.state.newPostText.replace(re, "@" + nick);
		this.setState({
			atMentionsOn: false
		});
		this.setNewPostText(text);
	};

	submitPost(newText) {
		newText = newText.replace(/<br>/g, "\n");
		var timestamp = +new Date();
		var newPost = {
			// FIXME fake data
			id: 3,
			author: "pez",
			body: newText,
			email: "pez@codestream.com",
			timestamp: timestamp
		};

		console.log(this.props.user);

		if (this.state.quoteText) {
			newPost.quoteText = this.state.quoteText;
			newPost.quoteRange = this.state.quoteRange;
		}

		// FIXME -- add the posts to some collection rather than directly
		// manipulating state
		this.setState(prevState => ({
			posts: [...prevState.posts, newPost]
		}));
		// reset the input field to blank
		this.setState({
			newPostText: "",
			quoteRange: null,
			quoteText: ""
		});
	}
}

const mapToProps = state => {
	return { user: state.user };
};

export default connect(mapToProps)(SimpleStream);