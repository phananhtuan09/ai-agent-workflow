#!/bin/bash

# Release script for ai-workflow-init
# Automatically bumps version, commits, pushes to GitHub, and publishes to npm

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository. Please initialize git first."
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes."
    read -p "Do you want to commit them first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        print_error "Please commit or stash your changes first."
        exit 1
    fi
fi

# Check if we're on main/master branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
    print_warning "You're not on main/master branch. Current branch: $current_branch"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version
current_version=$(node -p "require('./package.json').version")
print_step "Current version: $current_version"

# Ask for version bump type
echo "Select version bump type:"
echo "1) patch (1.1.0 → 1.1.1) - bug fixes"
echo "2) minor (1.1.0 → 1.2.0) - new features, backward compatible"
echo "3) major (1.1.0 → 2.0.0) - breaking changes"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        version_type="patch"
        ;;
    2)
        version_type="minor"
        ;;
    3)
        version_type="major"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_step "Bumping version: $version_type"

# Bump version using npm version (this also creates git tag)
npm version $version_type --no-git-tag-version

# Get new version
new_version=$(node -p "require('./package.json').version")
print_success "Version bumped: $current_version → $new_version"

# Ask for release message
read -p "Release message (optional): " release_msg
if [ -z "$release_msg" ]; then
    release_msg="Release v$new_version"
fi

# Commit version bump
print_step "Committing version bump..."
git add package.json package-lock.json
git commit -m "chore: bump version to $new_version

$release_msg"

# Create git tag
print_step "Creating git tag v$new_version..."
git tag -a "v$new_version" -m "$release_msg"
print_success "Tag created: v$new_version"

# Push to GitHub (including tags)
print_step "Pushing to GitHub..."
git push origin $current_branch
git push origin --tags
print_success "Pushed to GitHub"

# Ask if user wants to publish to npm
read -p "Publish to npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if user is logged in to npm
    if ! npm whoami > /dev/null 2>&1; then
        print_error "Not logged in to npm. Please run 'npm login' first."
        exit 1
    fi
    
    print_step "Publishing to npm..."
    npm publish
    print_success "Published to npm: ai-workflow-init@$new_version"
else
    print_warning "Skipped npm publish"
fi

print_success "Release complete! 🎉"
echo ""
echo "Summary:"
echo "  Version: $current_version → $new_version"
echo "  Tag: v$new_version"
echo "  GitHub: pushed"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  npm: published"
fi

