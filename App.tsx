import { useEffect, useState } from "react";
import { AccountsManagement } from "./components/AccountsManagement";
import { AddPostForm } from "./components/AddPostForm";
import { CalendarView } from "./components/Calendar";
import { Dashboard } from "./components/Dashboard";
import { RecentPosts } from "./components/RecentPosts";
import { ReportView } from "./components/ReportView";
import { Sidebar } from "./components/Sidebar";
import { TEST_POSTS } from "./testData";
import { SocialPost, ViewState } from "./types";

export default function App() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  // Check if test mode is enabled
  const isTestMode = import.meta.env.VITE_TEST_MODE === "true";

  // Load posts from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("socialOps_posts");
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        setPosts(parsedPosts);
      } catch (e) {
        console.error("Failed to parse posts", e);
        // If test mode is enabled and no saved posts, load test data
        if (isTestMode) {
          setPosts(TEST_POSTS);
        }
      }
    } else if (isTestMode) {
      // If test mode is enabled and no saved posts, load test data
      console.log("[App] Test mode enabled - loading test posts");
      setPosts(TEST_POSTS);
    }
  }, [isTestMode]);

  // Save posts to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("socialOps_posts", JSON.stringify(posts));
  }, [posts]);

  const handleSavePost = (post: SocialPost) => {
    if (editingPost) {
      // Update existing post
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      setEditingPost(null);
    } else {
      // Create new post
      setPosts((prev) => [...prev, post]);
    }
    setCurrentView("recent-posts");
  };

  const handleDeletePost = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      // If we are in calendar view and delete a post via modal, we stay there.
    }
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPost(post);
    setCurrentView("add-post");
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setCurrentView("recent-posts");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          setEditingPost(null); // Reset editing state when switching views manually
        }}
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {currentView === "dashboard" && <Dashboard posts={posts} />}

          {currentView === "calendar" && (
            <CalendarView
              posts={posts}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          )}

          {currentView === "recent-posts" && (
            <RecentPosts
              posts={posts}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          )}

          {currentView === "report" && <ReportView posts={posts} />}

          {currentView === "accounts-management" && (
            <AccountsManagement posts={posts} />
          )}

          {currentView === "add-post" && (
            <AddPostForm
              initialData={editingPost || undefined}
              onSave={handleSavePost}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
