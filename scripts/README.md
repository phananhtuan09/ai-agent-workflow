# Release Scripts

Scripts để tự động hóa quá trình release: bump version, commit, push GitHub và publish npm.

## Scripts

### `release.sh` (Bash - Linux/Mac)
Script bash để release. Yêu cầu bash shell.

**Usage:**
```bash
./scripts/release.sh
```

### `release.js` (Node.js - Cross-platform)
Script Node.js cross-platform để release. Hoạt động trên Windows, Linux, và Mac.

**Usage:**
```bash
# Interactive mode
node scripts/release.js

# With version type
node scripts/release.js patch   # 1.1.0 → 1.1.1
node scripts/release.js minor   # 1.1.0 → 1.2.0
node scripts/release.js major   # 1.1.0 → 2.0.0
```

**Hoặc dùng npm scripts:**
```bash
npm run release           # Interactive mode
npm run release:patch     # Patch version
npm run release:minor     # Minor version
npm run release:major     # Major version
```

## Quy trình Release

Script sẽ tự động:

1. ✅ Kiểm tra git repository và uncommitted changes
2. ✅ Hỏi loại version bump (patch/minor/major)
3. ✅ Bump version trong `package.json`
4. ✅ Commit version bump
5. ✅ Tạo git tag với release message
6. ✅ Push code và tags lên GitHub
7. ✅ Hỏi có muốn publish lên npm không
8. ✅ Publish lên npm (nếu chọn yes)

## Lưu ý

- **Git**: Phải có git repository và commit tất cả changes trước khi release
- **npm login**: Phải đăng nhập npm trước khi publish (`npm login`)
- **Branch**: Script sẽ cảnh báo nếu không ở branch `main` hoặc `master`
- **Uncommitted changes**: Script sẽ hỏi có muốn commit changes trước không

## Ví dụ

```bash
# Release patch version (bug fixes)
npm run release:patch

# Release minor version (new features)
npm run release:minor

# Release major version (breaking changes)
npm run release:major
```

