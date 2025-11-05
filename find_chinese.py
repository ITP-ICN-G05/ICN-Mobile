#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
查找项目中所有包含中文字符的文件和位置
"""
import os
import re
import sys

# 中文字符的正则表达式（包括中文标点符号）
CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]')

# 需要排除的目录和文件
EXCLUDE_DIRS = {
    'node_modules', '.git', 'build', 'dist', '.expo', 
    'android/build', 'ios/build', '.expo-shared',
    '__pycache__', '.pytest_cache', 'coverage'
}

EXCLUDE_FILES = {
    '.DS_Store', 'package-lock.json', 'yarn.lock',
    'find_chinese.py'  # 排除这个脚本本身
}

# 需要检查的文件扩展名
CHECK_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', 
    '.txt', '.yml', '.yaml', '.xml', '.html', '.css',
    '.java', '.kt', '.swift', '.m', '.h'
}

def should_check_file(filepath):
    """判断是否需要检查这个文件"""
    basename = os.path.basename(filepath)
    if basename in EXCLUDE_FILES:
        return False
    
    _, ext = os.path.splitext(filepath)
    return ext in CHECK_EXTENSIONS

def find_chinese_in_file(filepath):
    """在文件中查找中文字符"""
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                matches = list(CHINESE_PATTERN.finditer(line))
                if matches:
                    results.append({
                        'line': line_num,
                        'content': line.rstrip(),
                        'matches': [m.group() for m in matches]
                    })
    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
    
    return results

def scan_directory(root_dir):
    """扫描目录查找所有包含中文的文件"""
    all_results = {}
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 过滤需要排除的目录
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            
            if not should_check_file(filepath):
                continue
            
            results = find_chinese_in_file(filepath)
            if results:
                rel_path = os.path.relpath(filepath, root_dir)
                all_results[rel_path] = results
    
    return all_results

def print_results(results):
    """打印结果"""
    if not results:
        print("✅ 没有找到任何中文字符！")
        return
    
    print(f"❌ 找到 {len(results)} 个文件包含中文字符：\n")
    
    total_lines = 0
    for filepath, lines in sorted(results.items()):
        total_lines += len(lines)
        print(f"\n📁 {filepath}")
        print("-" * 80)
        for item in lines:
            chinese_chars = ''.join(item['matches'])
            print(f"  Line {item['line']}: {chinese_chars}")
            print(f"    {item['content'][:100]}")
    
    print(f"\n\n📊 总计: {len(results)} 个文件, {total_lines} 行包含中文")

if __name__ == '__main__':
    root = os.getcwd()
    print(f"🔍 正在扫描目录: {root}\n")
    results = scan_directory(root)
    print_results(results)

